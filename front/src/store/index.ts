import { applyMiddleware, createStore, Middleware } from "redux";
/// #if DEBUG
import logger from "redux-logger";
/// #endif
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
  readonly isShown: boolean;
  readonly message: string | null;
  readonly kind: "success" | "error";
  readonly id: number | null;
}

export interface IEnvironmentConfigState {
  readonly environmentConfigs: IEnvironmentConfig[];
}

let middlewares: Middleware[] = [thunk];
/// #if DEBUG
middlewares = [...middlewares, logger];
/// #endif

const store = createStore(rootReducer, applyMiddleware(...middlewares));

/// #if DEBUG
declare var module: any;
if (module.hot) {
  module.hot.accept("../reducers", () =>
    store.replaceReducer(require("../reducers").default)
  );
}
/// #endif

export default store;
