/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { routerMiddleware, RouterState } from "connected-react-router";
import { createBrowserHistory } from "history";
import { applyMiddleware, compose, createStore, Middleware } from "redux";
import thunk from "redux-thunk";
import createRootReducer from "../reducers";

export interface IHeatMapData {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  numColumns: number;
  numRows: number;
}

export type DataState = "empty" | "loading" | "loaded" | "failed";

export interface IHeatMapInfo {
  data?: IHeatMapData;
  status: DataState;
}

export interface IPerfCallTreeElementData {
  id: number;
  parentId?: number;
  label: string;
  childIds: number[];
  relativeRatio: number;
  immediateRatio: number;
  totalRatio: number;
  hasCode: boolean;
  firstLine?: number;
  code: Array<Array<string | { fragment: string }>>;
}

export type IPerfCallTreeData = IPerfCallTreeElementData[];

export interface IPerfCallTreeInfo {
  data?: IPerfCallTreeData;
  status: DataState;
}

export interface ISnapshotInfo {
  uuid: string;
  name?: string;
  pod?: string;
  environment?: string;
  createdAt?: Date;
  link: string;
  heatMapId: string;
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
  readonly heatMaps: Map<string, IHeatMapInfo>;
  readonly perfCallTrees: Map<string, IPerfCallTreeInfo>;
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
  createRootReducer(history),
  composeEnhancers(applyMiddleware(...middlewares))
);

declare var module: any;
if (module.hot) {
  module.hot.accept("../reducers", () =>
    store.replaceReducer(createRootReducer(history))
  );
}

export default store;
