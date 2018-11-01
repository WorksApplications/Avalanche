import {
  connectRouter,
  routerMiddleware,
  RouterState
} from "connected-react-router";
import { createBrowserHistory } from "history";
import { applyMiddleware, compose, createStore, Middleware } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers";

export interface ISnapshotInfo {
  uuid: string;
  name?: string;
  pod?: string;
  environment?: string;
  createdAt?: Date;
  link?: string;
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

export interface IEnvironmentConfig {
  name: string;
  version: string | null;
  isObservationEnabled: boolean | null;
  isMultiTenant: boolean | null;
  kubernetesApi: string | null;
}

export interface IApplicationState {
  readonly analysisData: IAnalysisDataState;
  readonly toastNotification: IToastNotificationState;
  readonly environmentConfig: IEnvironmentConfigState;
  readonly router: RouterState;
}

export interface IAnalysisDataState {
  readonly applicationName: string | null;
  readonly applications: string[];
  readonly selectedEnvironment: string | null;
  readonly environments: { [appName: string]: IEnvironmentInfo };
  readonly runningPods: IPodInfo[];
  readonly selectedPod: string | null;
  readonly pods: IPodInfo[];
  readonly snapshots: ISnapshotInfo[];
}

export interface IToastNotificationState {
  readonly notifications: Array<{
    readonly isShown: boolean;
    readonly message: string;
    readonly kind: "success" | "error";
    readonly id: number;
  }>;
}

export interface IEnvironmentConfigState {
  readonly environmentConfigs: IEnvironmentConfig[];
}

export const history = createBrowserHistory();

const middlewares: Middleware[] = [routerMiddleware(history), thunk];

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  connectRouter(history)(rootReducer),
  composeEnhancers(applyMiddleware(...middlewares))
);

declare var module: any;
if (module.hot) {
  module.hot.accept("../reducers", () =>
    store.replaceReducer(connectRouter(history)(require("../reducers").default))
  );
}

export default store;
