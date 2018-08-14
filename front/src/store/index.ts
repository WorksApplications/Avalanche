import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import { indexApp } from "../reducers";

export interface ISnapshotInfo {
  uuid: string;
  createdAt?: Date;
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
  readonly environments: { [appName: string]: IEnvironmentInfo };
}

const store = createStore(indexApp, applyMiddleware(thunk));
export default store;
