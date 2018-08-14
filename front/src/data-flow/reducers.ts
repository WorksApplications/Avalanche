import { Environment } from "../generated/collect";
import {
  GET_APPS_RECEIVE,
  GET_ENVS_OF_APP_RECEIVE,
  IAction,
  SELECT_APP
} from "./actions";
import { IApplicationState, IEnvironmentInfo, IPodInfo } from "./store";

const INIT: IApplicationState = {
  applicationName: null,
  applications: [],
  environments: {}
};

export function indexApp(
  state: IApplicationState = INIT,
  action: IAction
): IApplicationState {
  switch (action.type) {
    case SELECT_APP:
      return { ...state, applicationName: action.payload.appName };
    case GET_APPS_RECEIVE:
      return { ...state, applications: action.payload.apps };
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
            createdAt: s.createdAt
          }))
        })),
        liveCount: e.liveCount
      }));
      for (const e of envInfos) {
        newEnvironments[e.name] = e;
      }
      return { ...state, environments: newEnvironments };
    default:
      return state;
  }
}
