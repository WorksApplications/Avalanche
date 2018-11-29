import { LOCATION_CHANGE } from "connected-react-router";
import * as qs from "querystring";
import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsOperation,
  getEnvironmentsOfAppOperation,
  getHeatMapOperation,
  getLatestSnapshotsOperation,
  getPerfCallTreeOperation,
  getRunningPodsOperation,
  IPerfCallTree,
  postSnapshotOperation
} from "../actions";
import { IHeatMap } from "../clients/heatMapClient";
import {
  IAnalysisDataState,
  IHeatMapData,
  IHeatMapInfo,
  IPerfCallTreeData,
  IPerfCallTreeElementData,
  IPerfCallTreeInfo,
  IPodInfo,
  ISnapshotInfo
} from "../store";

const INIT: IAnalysisDataState = {
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

export function convertPerfCallTree(tree: IPerfCallTree): IPerfCallTreeData {
  const array: IPerfCallTreeData = [];
  let counter = 0;
  function convert_(node: IPerfCallTree, parentId?: number): number {
    const id = counter;
    const body: IPerfCallTreeElementData = {
      id,
      parentId,
      label: node.name,
      immediateRatio: node.immediateRatio,
      totalRatio: node.totalRatio,
      childIds: []
    };
    array.push(body);
    counter++;
    for (const t of node.children) {
      const childId = convert_(t, id);
      body.childIds.push(childId);
    }
    return id;
  }

  convert_(tree);
  return array;
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

export function analysisData(
  state: IAnalysisDataState = INIT,
  action: Action
): IAnalysisDataState {
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
    return { ...state, applications: action.payload.result.apps };
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
      snapshots
    };
  }
  if (isType(action, getRunningPodsOperation.async.done)) {
    return { ...state, runningPods: action.payload.result.pods };
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
      snapshots: action.payload.result.snapshots
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
