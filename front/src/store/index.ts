import { applyMiddleware, createStore, Middleware } from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import { IS_DEBUG } from "../constants";
import { indexApp } from "../reducers";

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
  readonly applicationName: string | null;
  readonly applications: string[];
  readonly selectedEnvironment: string | null;
  readonly environments: { [appName: string]: IEnvironmentInfo };
  readonly runningPods: IPodInfo[];
  readonly selectedPod: string | null;
}

let middlewares: Middleware[] = [thunk];
if (IS_DEBUG) {
  middlewares = [...middlewares, logger];
}

const store = createStore(indexApp, applyMiddleware(...middlewares));
export default store;
