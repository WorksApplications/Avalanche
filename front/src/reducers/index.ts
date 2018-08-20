import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsAsyncAction,
  getEnvironmentsOfAppAsyncAction,
  getRunningPodsAsyncAction,
  hideToastr,
  selectApp,
  selectEnv,
  selectPod,
  showToastr
} from "../actions";
import * as collect from "../generated/collect/api";
import {
  IApplicationState,
  IEnvironmentInfo,
  IPodInfo,
  ISnapshotInfo
} from "../store";

function podInfoConvert(pod: collect.Pod): IPodInfo {
  return {
    id: pod.id,
    name: pod.name,
    isLive: pod.isLive,
    createdAt: pod.createdAt,
    app: pod.app,
    env: pod.environment,
    snapshots: (pod.snapshots || []).map(s => snapshotInfoConvert(s))
  };
}

function snapshotInfoConvert(snapshot: collect.Snapshot): ISnapshotInfo {
  return {
    uuid: snapshot.uuid,
    name: undefined,
    pod: snapshot.pod,
    environment: snapshot.environment,
    createdAt: snapshot.createdAt,
    link: snapshot.flamescopeLink
  };
}

// TODO use combineReducer
const INIT: IApplicationState = {
  applicationName: null,
  applications: [],
  selectedEnvironment: null,
  environments: {},
  runningPods: [],
  selectedPod: null,
  isToastrShown: false,
  toastrMessage: null,
  toastrKind: "error",
  toastrId: null
};

export function indexApp(
  state: IApplicationState = INIT,
  action: Action
): IApplicationState {
  if (isType(action, selectApp)) {
    return { ...state, applicationName: action.payload.appName };
  }
  if (isType(action, getAppsAsyncAction.done)) {
    return { ...state, applications: action.payload.result.apps };
  }
  if (isType(action, selectEnv)) {
    return { ...state, selectedEnvironment: action.payload.envName };
  }
  if (isType(action, getEnvironmentsOfAppAsyncAction.done)) {
    const newEnvironments = { ...state.environments };
    const envInfos: IEnvironmentInfo[] = action.payload.result.envs.map(e => ({
      id: e.id,
      name: e.name,
      pods: (e.pods || []).map<IPodInfo>(p => podInfoConvert(p)),
      liveCount: e.liveCount
    }));
    for (const e of envInfos) {
      newEnvironments[e.name] = e;
    }
    return { ...state, environments: newEnvironments };
  }
  if (isType(action, getRunningPodsAsyncAction.done)) {
    return {
      ...state,
      runningPods: action.payload.result.pods.map(p => podInfoConvert(p))
    };
  }
  if (isType(action, selectPod)) {
    return { ...state, selectedPod: action.payload.podName };
  }
  if (isType(action, showToastr)) {
    return {
      ...state,
      isToastrShown: true,
      toastrMessage: action.payload.message,
      toastrKind: action.payload.kind,
      toastrId: action.payload.id
    };
  }
  if (isType(action, hideToastr)) {
    if (action.payload.id === state.toastrId) {
      return {
        ...state,
        isToastrShown: false
      };
    }
    return state;
  }
  return state;
}
