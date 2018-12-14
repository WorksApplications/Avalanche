/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LOCATION_CHANGE } from "connected-react-router";
import * as qs from "querystring";
import { Action } from "redux";
import { actionCreatorFactory, isType } from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import heatMapClient, { IHeatMap } from "../clients/heatMapClient";
import { BLAME_API_BASE, COLLECT_API_BASE } from "../constants";
import {
  Code,
  DefaultApiFactory as blameApiFactory,
  Report
} from "../generated/blame/api";
import {
  DefaultApiFactory as collectApiFactory,
  Environment,
  Pod,
  Snapshot
} from "../generated/collect/api";

export interface ISnapshotInfo {
  uuid: string;
  name?: string;
  pod?: string;
  environment?: string;
  createdAt?: Date;
  link: string;
  heatMapId: string;
}

export interface IPodInfo {
  id?: number;
  name: string;
  isAlive?: boolean;
  createdAt?: Date;
  app?: string;
  env?: string;
  snapshots?: ISnapshotInfo[];
  isSaving?: boolean;
}

export interface IEnvironmentInfo {
  id: number;
  name: string;
  pods: IPodInfo[];
  liveCount?: number;
}

export interface IHeatMapData {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  numColumns: number;
  numRows: number;
}

export type DataState = "empty" | "loading" | "loaded" | "failed";

export interface IHeatMapInfo {
  data?: IHeatMapData;
  status: DataState;
}

export interface IPerfCallTreeElementData {
  id: number;
  parentId?: number;
  label: string;
  childIds: number[];
  relativeRatio: number;
  immediateRatio: number;
  totalRatio: number;
  hasCode: boolean;
  firstLine?: number;
  snippetLink?: string;
  code: Array<Array<string | { fragment: string }>>;
}

export type IPerfCallTreeData = IPerfCallTreeElementData[];

export interface IPerfCallTreeInfo {
  data?: IPerfCallTreeData;
  status: DataState;
}

export interface IState {
  readonly applicationName: string | null;
  readonly applications: string[];
  readonly selectedEnvironment: string | null;
  readonly environments: { [appName: string]: IEnvironmentInfo };
  readonly runningPods: IPodInfo[];
  readonly selectedPod: string | null;
  readonly pods: IPodInfo[];
  readonly snapshots: ISnapshotInfo[];
  readonly heatMaps: Map<string, IHeatMapInfo>;
  readonly perfCallTrees: Map<string, IPerfCallTreeInfo>;
}

const INIT: IState = {
  applicationName: null,
  applications: [],
  selectedEnvironment: null,
  environments: {},
  runningPods: [],
  selectedPod: null,
  pods: [],
  snapshots: [],
  heatMaps: new Map<string, IHeatMapInfo>(),
  perfCallTrees: new Map<string, IPerfCallTreeInfo>()
};

const actionCreator = actionCreatorFactory();
const asyncActionCreator = asyncFactory(actionCreator);

const collectClient = collectApiFactory({}, undefined, COLLECT_API_BASE);

const blameClient = blameApiFactory({}, undefined, BLAME_API_BASE);

function environmentInfoConvert(env: Environment): IEnvironmentInfo {
  return {
    id: env.id,
    name: env.name,
    pods: (env.pods || []).map<IPodInfo>(p => podInfoConvert(p)),
    liveCount: env.liveCount
  };
}

function podInfoConvert(pod: Pod): IPodInfo {
  const created = new Date(pod.createdAt ? pod.createdAt : 0);
  return {
    id: pod.id,
    name: pod.name,
    isAlive: pod.isAlive,
    createdAt: created,
    app: pod.app,
    env: pod.environment,
    snapshots: (pod.snapshots || []).map(s => snapshotInfoConvert(s))
  };
}

function snapshotInfoConvert(snapshot: Snapshot): ISnapshotInfo {
  const created = new Date(snapshot.createdAt ? snapshot.createdAt : 0);
  const tokens = snapshot.flamescopeLink!.split("/");
  const heatMapId = tokens[tokens.length - 1];

  return {
    uuid: snapshot.uuid,
    name: undefined,
    pod: snapshot.pod,
    environment: snapshot.environment,
    createdAt: created,
    link: snapshot.flamescopeLink!,
    heatMapId
  };
}

export interface IPerfCallTree {
  name: string;
  totalRatio: number;
  immediateRatio: number;
  code: Array<{ snippet: string }>;
  firstLine?: number;
  snippetLink?: string;
  children: IPerfCallTree[];
}

function convertCode1(code?: Code[]): Array<{ snippet: string }> {
  if (typeof code === "undefined") {
    return [];
  }

  return code
    .filter(x => typeof x.snippet !== "undefined")
    .map(x => ({
      snippet: x.snippet!
    }));
}

function perfCallTreeConvert(report: Report): IPerfCallTree {
  return {
    name: report.name!,
    totalRatio: report.total_ratio!,
    immediateRatio: report.immediate_ratio!,
    code: convertCode1(report.code),
    firstLine: report.line_start_at,
    snippetLink: report.primary_link,
    children: report.children ? report.children.map(perfCallTreeConvert) : []
  };
}

export const getAppsOperation = asyncActionCreator<{}, { apps: string[] }>(
  "GET_APPS",
  () =>
    collectClient.getApps().then((apps: string[]) => {
      return { apps };
    })
);

export const getEnvironmentsOfAppOperation = asyncActionCreator<
  { app: string },
  { envs: IEnvironmentInfo[] }
>("GET_ENVS_OF_APP", ({ app }) =>
  collectClient.getEnvironments(app).then((envResults: Environment[]) => {
    const envs = envResults.map(env => environmentInfoConvert(env));
    return { envs };
  })
);

export const getRunningPodsOperation = asyncActionCreator<
  {},
  { pods: IPodInfo[] }
>("GET_RUNNING_PODS", () =>
  collectClient.listAvailablePods().then((podResults: Pod[]) => {
    const pods = podResults.map(pod => podInfoConvert(pod));
    return { pods };
  })
);

export const postSnapshotOperation = asyncActionCreator<
  {
    appId: string;
    environment: string;
    podId: string;
  },
  { newSnapshot: ISnapshotInfo }
>("POST_NEW_SNAPSHOT", ({ appId, environment, podId }) =>
  collectClient
    .newSnapshot(appId, environment, podId, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch"
    })
    .then((snapshot: Snapshot) => {
      const newSnapshot = snapshotInfoConvert(snapshot);
      return { newSnapshot };
    })
);

export const getLatestSnapshotsOperation = asyncActionCreator<
  { count: number },
  { snapshots: ISnapshotInfo[] }
>("GET_LATEST_SNAPSHOTS", ({ count }) =>
  collectClient.listSnapshots("date", count).then(snapshotResults => {
    const snapshots = snapshotResults.map(s => snapshotInfoConvert(s));
    return { snapshots };
  })
);

export const getHeatMapOperation = asyncActionCreator<
  { snapshotId: string; heatMapId: string },
  { heatMap: IHeatMap }
>("GET_HEAT_MAP", ({ heatMapId }) =>
  heatMapClient(heatMapId).then(result => {
    return { heatMap: result };
  })
);

export const getPerfCallTreeOperation = asyncActionCreator<
  { snapshotId: string; startPosition: number; endPosition: number },
  { tree: IPerfCallTree }
>("GET_PERF_CALL_TREE", ({ snapshotId, startPosition, endPosition }) =>
  blameClient
    .reportsUuidGet(snapshotId, startPosition, endPosition)
    .then(result => {
      return { tree: perfCallTreeConvert(result) };
    })
);

export function convertHeatMap(
  heatMap: IHeatMap,
  maxValueSize: number
): IHeatMapData {
  const rawValues = heatMap.values;
  let meanValues: number[] = [];
  let maxValues: number[] = [];
  if (rawValues.length > maxValueSize) {
    for (let i = 0; i < maxValueSize; i++) {
      let sum = 0;
      let max = 0;
      const start = Math.floor((rawValues.length / maxValueSize) * i);
      const end = Math.ceil((rawValues.length / maxValueSize) * (i + 1));
      for (let j = start; j < end; j++) {
        const v = rawValues[j];
        sum += v;
        if (v > max) {
          max = v;
        }
      }
      meanValues.push(sum / (end - start));
      maxValues.push(max);
    }
  } else {
    meanValues = rawValues;
    maxValues = rawValues;
  }
  return {
    meanValues,
    maxValues,
    maxValueOfData: heatMap.maxValue,
    numColumns: heatMap.numColumns,
    numRows: heatMap.numRows
  };
}

export function convertCode(
  code: Array<{ snippet: string }>
): Array<Array<string | { fragment: string }>> {
  // chunks to lines with chunks
  const result: Array<Array<{ fragment: string }>> = [];
  let current: Array<{ fragment: string }> = [];
  for (const x of code) {
    const lines = x.snippet.split("\n");
    const first = lines.shift()!;
    current.push({ fragment: first });
    if (lines.length === 0) {
      continue;
    }
    result.push(current);
    const last = lines.pop()!;
    current = [{ fragment: last }];
    for (const y of lines) {
      result.push([{ fragment: y }]);
    }
  }
  if (current.length > 0) {
    result.push(current);
  }

  return result;
}

export function convertPerfCallTree(tree: IPerfCallTree): IPerfCallTreeData {
  const array: IPerfCallTreeData = [];
  let counter = 0;

  function convert_(
    node: IPerfCallTree,
    parentTotalRatio: number,
    parentId?: number
  ): number {
    const id = counter;
    const hasCode = node.code.length > 0;
    const body: IPerfCallTreeElementData = {
      id,
      parentId,
      label: node.name,
      relativeRatio: node.totalRatio / parentTotalRatio,
      immediateRatio: node.immediateRatio,
      totalRatio: node.totalRatio,
      hasCode,
      firstLine: hasCode ? node.firstLine! : undefined,
      snippetLink: hasCode ? node.snippetLink! : undefined,
      code: convertCode(node.code),
      childIds: []
    };
    array.push(body);
    counter++;
    for (const t of node.children) {
      const childId = convert_(t, node.totalRatio, id);
      body.childIds.push(childId);
    }
    return id;
  }

  convert_(tree, 1.0);
  return array;
}

function sortApplications(applications: string[]): string[] {
  return applications.sort();
}

function sortPods(pods: IPodInfo[]): IPodInfo[] {
  return pods.sort((a, b) => {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }

    // living pod first
    if (a.isAlive && !b.isAlive) {
      return -1;
    }
    if (!a.isAlive && b.isAlive) {
      return 1;
    }

    if (!a.createdAt) {
      return 1;
    }
    if (!b.createdAt) {
      return -1;
    }

    // newer pod first
    const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    // dictionary order
    return a.name > b.name ? 1 : -1;
  });
}

function sortSnapshots(snapshots: ISnapshotInfo[]): ISnapshotInfo[] {
  return snapshots.sort((a, b) => {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }

    if (!a.createdAt) {
      return 1;
    }
    if (!b.createdAt) {
      return -1;
    }

    // newer pod first
    const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    if (!a.name) {
      return 1;
    }

    if (!b.name) {
      return -1;
    }

    // dictionary order
    return a.name > b.name ? 1 : -1;
  });
}

function paramExists<K extends string>(
  params: any,
  paramName: K
): params is { [P in K]: string } {
  return (
    paramName in params &&
    typeof params[paramName] === "string" &&
    !!params[paramName]
  );
}

export function reducer(state: IState = INIT, action: Action): IState {
  if (action.type === LOCATION_CHANGE) {
    // @ts-ignore
    const search: string = action.payload.location.search;
    if (!search.startsWith("?") || search === "?") {
      // back to "/"
      return {
        ...state,
        applicationName: null,
        selectedEnvironment: null,
        selectedPod: null
      };
    } else {
      const params = qs.parse(search.substring(1));
      if (paramExists(params, "app")) {
        if (paramExists(params, "env")) {
          if (paramExists(params, "pod")) {
            return {
              ...state,
              applicationName: params.app,
              selectedEnvironment: params.env,
              selectedPod: params.pod
            };
          } else {
            return {
              ...state,
              applicationName: params.app,
              selectedEnvironment: params.env,
              selectedPod: null
            };
          }
        } else {
          return {
            ...state,
            applicationName: params.app,
            selectedEnvironment: null,
            selectedPod: null
          };
        }
      } else {
        return {
          ...state,
          applicationName: null,
          selectedEnvironment: null,
          selectedPod: null
        };
      }
    }
  }
  if (isType(action, getAppsOperation.async.done)) {
    return {
      ...state,
      applications: sortApplications(action.payload.result.apps)
    };
  }
  if (isType(action, getEnvironmentsOfAppOperation.async.done)) {
    const environments = { ...state.environments };
    for (const e of action.payload.result.envs) {
      environments[e.name] = e;
    }
    const pods = action.payload.result.envs.reduce(
      // flat-map
      (acc: IPodInfo[], x) => acc.concat(x.pods),
      []
    );
    const snapshots = pods.reduce(
      // flat-map
      (acc: ISnapshotInfo[], x) =>
        x.snapshots ? acc.concat(x.snapshots) : acc,
      []
    );

    return {
      ...state,
      environments,
      pods,
      snapshots: sortSnapshots(snapshots)
    };
  }
  if (isType(action, getRunningPodsOperation.async.done)) {
    return { ...state, runningPods: sortPods(action.payload.result.pods) };
  }
  if (isType(action, postSnapshotOperation.async.started)) {
    return {
      ...state,
      runningPods: state.runningPods.map(pod =>
        pod.name === action.payload.podId ? { ...pod, isSaving: true } : pod
      )
    };
  }
  if (isType(action, postSnapshotOperation.async.done)) {
    return {
      ...state,
      runningPods: state.runningPods.map(pod =>
        pod.name === action.payload.params.podId
          ? {
              ...pod,
              isSaving: false,
              snapshots: pod.snapshots
                ? [...pod.snapshots, action.payload.result.newSnapshot]
                : [action.payload.result.newSnapshot]
            }
          : pod
      )
    };
  }
  if (isType(action, postSnapshotOperation.async.failed)) {
    return {
      ...state,
      runningPods: state.runningPods.map(pod =>
        pod.name === action.payload.params.podId
          ? { ...pod, isSaving: false }
          : pod
      )
    };
  }
  if (isType(action, getLatestSnapshotsOperation.async.done)) {
    return {
      ...state,
      snapshots: sortSnapshots(action.payload.result.snapshots)
    };
  }

  if (isType(action, getHeatMapOperation.async.started)) {
    const key = action.payload.heatMapId;
    const current = state.heatMaps.get(key);
    if (current && current.status === "loading") {
      return state;
    }

    const newMaps = new Map(state.heatMaps);
    newMaps.set(key, { status: "loading" });
    return {
      ...state,
      heatMaps: newMaps
    };
  }
  if (isType(action, getHeatMapOperation.async.done)) {
    // reduce `values` for performance
    const heatMap = convertHeatMap(action.payload.result.heatMap, 1200 * 4);

    const key = action.payload.params.heatMapId;
    const newMaps = new Map(state.heatMaps);
    newMaps.set(key, { status: "loaded", data: heatMap });
    return {
      ...state,
      heatMaps: newMaps
    };
  }
  if (isType(action, getHeatMapOperation.async.failed)) {
    const key = action.payload.params.heatMapId;
    const newMaps = new Map(state.heatMaps);
    newMaps.set(key, { status: "failed" });
    return {
      ...state,
      heatMaps: newMaps
    };
  }

  if (isType(action, getPerfCallTreeOperation.async.started)) {
    const key = action.payload.snapshotId;

    const newTrees = new Map(state.perfCallTrees);
    newTrees.set(key, { status: "loading" }); // purge previous data
    return { ...state, perfCallTrees: newTrees };
  }
  if (isType(action, getPerfCallTreeOperation.async.done)) {
    const perfCallTree = action.payload.result.tree;

    const key = action.payload.params.snapshotId;
    const newTrees = new Map(state.perfCallTrees);
    newTrees.set(key, {
      status: "loaded",
      data: convertPerfCallTree(perfCallTree)
    });
    return { ...state, perfCallTrees: newTrees };
  }
  if (isType(action, getPerfCallTreeOperation.async.failed)) {
    const key = action.payload.params.snapshotId;
    const newTrees = new Map(state.perfCallTrees);
    newTrees.set(key, { status: "failed" });
    return { ...state, perfCallTrees: newTrees };
  }

  return state;
}
