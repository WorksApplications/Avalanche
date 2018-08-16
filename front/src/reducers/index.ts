import { isType } from "typescript-fsa";
import {
  GET_ENVS_OF_APP_RECEIVE,
  GET_RUNNING_PODS_RECEIVE,
  getAppsAsyncAction,
  IAction,
  selectApp,
  selectEnv
} from "../actions";
import { Environment, Pod } from "../generated/collect";
import { IApplicationState, IEnvironmentInfo, IPodInfo } from "../store";

const INIT: IApplicationState = {
  applicationName: null,
  applications: [],
  selectedEnvironment: null,
  environments: {},
  runningPods: []
};

export function indexApp(
  state: IApplicationState = INIT,
  action: IAction
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
  switch (action.type) {
    case GET_ENVS_OF_APP_RECEIVE:
      const newEnvironments = { ...state.environments };
      const envs: Environment[] = action.payload.environments;
      const envInfos: IEnvironmentInfo[] = envs.map(e => ({
        id: e.id,
        name: e.name,
        pods: (e.pods || []).map<IPodInfo>(p => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          isLive: p.isLive,
          app: p.app,
          env: p.environment,
          snapshots: (p.snapshots || []).map(s => ({
            uuid: s.uuid,
            name: undefined,
            pod: s.pod,
            environment: s.environment,
            createdAt: s.createdAt,
            link: s.flamescopeLink
          }))
        })),
        liveCount: e.liveCount
      }));
      for (const e of envInfos) {
        newEnvironments[e.name] = e;
      }
      return { ...state, environments: newEnvironments };
    case GET_RUNNING_PODS_RECEIVE:
      const runningPods: IPodInfo[] = action.payload.pods.map((p: Pod) => ({
        id: p.id,
        name: p.name,
        isLive: p.isLive,
        createdAt: p.createdAt,
        app: p.app,
        env: p.environment,
        snapshots: (p.snapshots || []).map(s => ({
          uuid: s.uuid,
          name: undefined,
          pod: s.pod,
          environment: s.environment,
          createdAt: s.createdAt,
          link: s.flamescopeLink
        }))
      }));
      return {
        ...state,
        runningPods
      };
    default:
      return state;
  }
}
