import { LOCATION_CHANGE } from "connected-react-router";
import * as qs from "querystring";
import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsOperation,
  getEnvironmentsOfAppOperation,
  getHeatMapOperation,
  getLatestSnapshotsOperation,
  getRunningPodsOperation,
  postSnapshotOperation
} from "../actions";
import { IHeatMap } from "../clients/heatMapClient";
import {
  HeatMapState,
  IAnalysisDataState,
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
  snapshots: []
};

export function reduceHeatMap(
  heatMap: IHeatMap,
  maxValueSize: number
): IHeatMap {
  const rawValues = heatMap.values;
  let values: number[] = [];
  if (rawValues.length > maxValueSize) {
    for (let i = 0; i < maxValueSize; i++) {
      let v = 0;
      const start = Math.floor((rawValues.length / maxValueSize) * i);
      const end = Math.ceil((rawValues.length / maxValueSize) * (i + 1));
      for (let j = start; j < end; j++) {
        const c = rawValues[j];
        if (c > v) {
          v = c;
        }
      }
      values.push(v);
    }
  } else {
    values = rawValues;
  }
  return { values, maxValue: heatMap.maxValue };
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
      runningPods: state.runningPods.map(
        pod =>
          pod.name === action.payload.podId ? { ...pod, isSaving: true } : pod
      )
    };
  }
  if (isType(action, postSnapshotOperation.async.done)) {
    return {
      ...state,
      runningPods: state.runningPods.map(
        pod =>
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
      runningPods: state.runningPods.map(
        pod =>
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
    return {
      ...state,
      snapshots: state.snapshots.map(
        x =>
          x.uuid === action.payload.snapshotId
            ? { ...x, heatMapStatus: "loading" as HeatMapState }
            : x
      )
    };
  }
  if (isType(action, getHeatMapOperation.async.done)) {
    // reduce `values` to 250 data for performance
    const heatMap = reduceHeatMap(action.payload.result.heatMap, 250);

    return {
      ...state,
      snapshots: state.snapshots.map(
        x =>
          x.uuid === action.payload.params.snapshotId
            ? { ...x, heatMap, heatMapStatus: "loaded" as HeatMapState }
            : x
      )
    };
  }
  if (isType(action, getHeatMapOperation.async.failed)) {
    return {
      ...state,
      snapshots: state.snapshots.map(
        x =>
          x.uuid === action.payload.params.snapshotId
            ? { ...x, heatMapStatus: "failed" as HeatMapState }
            : x
      )
    };
  }

  return state;
}
