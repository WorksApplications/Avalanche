import { LOCATION_CHANGE } from "connected-react-router";
import * as qs from "querystring";
import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsOperation,
  getEnvironmentsOfAppOperation,
  getLatestSnapshotsOperation,
  getRunningPodsOperation,
  postSnapshotOperation
} from "../actions";
import { IAnalysisDataState, IPodInfo, ISnapshotInfo } from "../store";

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

  return state;
}
