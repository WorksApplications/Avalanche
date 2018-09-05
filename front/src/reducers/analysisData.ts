import { Action } from "redux";
import { isType } from "typescript-fsa";
import {
  getAppsAsyncAction,
  getEnvironmentsOfAppAsyncAction,
  getRunningPodsAsyncAction,
  selectApp,
  selectEnv,
  selectPod
} from "../actions";
import * as collect from "../generated/collect/api";
import {
  IAnalysisDataState,
  IEnvironmentInfo,
  IPodInfo,
  ISnapshotInfo
} from "../store";

function podInfoConvert(pod: collect.Pod): IPodInfo {
  const created = new Date(pod.createdAt ? pod.createdAt : 0)
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

function snapshotInfoConvert(snapshot: collect.Snapshot): ISnapshotInfo {
  const created = new Date(snapshot.createdAt ? snapshot.createdAt : 0)
  return {
    uuid: snapshot.uuid,
    name: undefined,
    pod: snapshot.pod,
    environment: snapshot.environment,
    createdAt: created,
    link: snapshot.flamescopeLink
  };
}

const INIT: IAnalysisDataState = {
  applicationName: null,
  applications: [],
  selectedEnvironment: null,
  environments: {},
  runningPods: [],
  selectedPod: null
};

export function analysisData(
  state: IAnalysisDataState = INIT,
  action: Action
): IAnalysisDataState {
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
  return state;
}
