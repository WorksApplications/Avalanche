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
import {
  connectRouter,
  routerMiddleware,
  RouterState
} from "connected-react-router";
import { createBrowserHistory } from "history";
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore,
  Middleware,
  Reducer
} from "redux";
import thunk from "redux-thunk";
import {
  IState as AnalysisDataState,
  reducer as analysisDataReducer
} from "./modules/analysisData";
import {
  IState as EnvironmentState,
  reducer as environmentConfigReducer
} from "./modules/environmentConfig";
import {
  IState as ToastNotificationState,
  reducer as toastNotificationReducer
} from "./modules/toastNotification";

const createRootReducer = (historyParam: any) =>
  // tslint:disable-next-line:no-object-literal-type-assertion
  combineReducers({
    analysisData: analysisDataReducer,
    toastNotification: toastNotificationReducer,
    environmentConfig: environmentConfigReducer,
    router: connectRouter(historyParam)
  } as { [P in keyof IApplicationState]: Reducer<IApplicationState[P]> });

export interface IApplicationState {
  readonly analysisData: AnalysisDataState;
  readonly toastNotification: ToastNotificationState;
  readonly environmentConfig: EnvironmentState;
  readonly router: RouterState;
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
  module.hot.accept(
    // this can be improved...
    [
      "./modules/analysisData",
      "./modules/environmentConfig",
      "./modules/toastNotification"
    ],
    () => store.replaceReducer(createRootReducer(history))
  );
}

export default store;
