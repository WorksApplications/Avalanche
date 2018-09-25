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
import { IAnalysisDataState, IPodInfo } from "../store";

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
    return { ...state, applications: action.payload.result.apps.sort() };
  }
  if (isType(action, selectEnv)) {
    return { ...state, selectedEnvironment: action.payload.envName };
  }
  if (isType(action, getEnvironmentsOfAppAsyncAction.done)) {
    const newEnvironments = { ...state.environments };
    for (const e of action.payload.result.envs) {
      newEnvironments[e.name] = e;
    }
    return { ...state, environments: newEnvironments };
  }
  if (isType(action, getRunningPodsAsyncAction.done)) {
    return {
      ...state,
      runningPods: action.payload.result.pods.sort(
        (a: IPodInfo, b: IPodInfo) => {
          if (!a || !a.createdAt) {
            return 1;
          } else if (!b || !b.createdAt) {
            return -1;
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
      )
    };
  }
  if (isType(action, selectPod)) {
    return { ...state, selectedPod: action.payload.podName };
  }
  return state;
}
