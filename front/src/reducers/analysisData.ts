import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsThunk,
  getEnvironmentsOfAppThunk,
  getLatestSnapshotsThunk,
  getRunningPodsThunk,
  postSnapshotThunk,
  selectApp,
  selectEnv,
  selectPod
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

export function analysisData(
  state: IAnalysisDataState = INIT,
  action: Action
): IAnalysisDataState {
  if (isType(action, selectApp)) {
    return { ...state, applicationName: action.payload.appName };
  }
  if (isType(action, getAppsThunk.async.done)) {
    return { ...state, applications: action.payload.result.apps };
  }
  if (isType(action, selectEnv)) {
    return { ...state, selectedEnvironment: action.payload.envName };
  }
  if (isType(action, getEnvironmentsOfAppThunk.async.done)) {
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
  if (isType(action, getRunningPodsThunk.async.done)) {
    return { ...state, runningPods: action.payload.result.pods };
  }
  if (isType(action, selectPod)) {
    return { ...state, selectedPod: action.payload.podName };
  }
  if (isType(action, postSnapshotThunk.async.started)) {
    return {
      ...state,
      runningPods: state.runningPods.map(
        pod =>
          pod.name === action.payload.podId ? { ...pod, isSaving: true } : pod
      )
    };
  }
  if (isType(action, postSnapshotThunk.async.done)) {
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
  if (isType(action, postSnapshotThunk.async.failed)) {
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
  if (isType(action, getLatestSnapshotsThunk.async.done)) {
    return {
      ...state,
      snapshots: action.payload.result.snapshots
    };
  }

  return state;
}
