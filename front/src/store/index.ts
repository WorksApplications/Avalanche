import { applyMiddleware, createStore, Middleware } from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import { IS_DEBUG } from "../constants";
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
  isLive?: boolean;
  createdAt?: Date;
  app?: string;
  env?: string;
  snapshots?: ISnapshotInfo[];
}

export interface IEnvironmentInfo {
  id: number;
  name: string;
  pods: IPodInfo[];
  liveCount?: number;
}

export interface IApplicationState {
  readonly analysisData: IAnalysisDataState;
  readonly toastNotification: IToastNotificationState;
}

export interface IAnalysisDataState {
  readonly applicationName: string | null;
  readonly applications: string[];
  readonly selectedEnvironment: string | null;
  readonly environments: { [appName: string]: IEnvironmentInfo };
  readonly runningPods: IPodInfo[];
  readonly selectedPod: string | null;
}

export interface IToastNotificationState {
  readonly isShown: boolean;
  readonly message: string | null;
  readonly kind: "success" | "error";
  readonly id: number | null;
}

let middlewares: Middleware[] = [thunk];
if (IS_DEBUG) {
  middlewares = [...middlewares, logger];
}

const store = createStore(rootReducer, applyMiddleware(...middlewares));
export default store;
