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
import { Action } from "redux";
import actionCreatorFactory, { isType } from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import { COLLECT_API_BASE } from "../constants";
import {
  DefaultApiFactory as collectApiFactory,
  EnvironmentConfig
} from "../generated/collect/api";

export interface IEnvironmentConfig {
  name: string;
  version: string | null;
  isObservationEnabled: boolean | null;
  isMultiTenant: boolean | null;
  kubernetesApi: string | null;
}

export interface IState {
  readonly environmentConfigs: IEnvironmentConfig[];
}

const INIT: IState = {
  environmentConfigs: []
};

const actionCreator = actionCreatorFactory();
const asyncActionCreator = asyncFactory(actionCreator);

const collectClient = collectApiFactory({}, undefined, COLLECT_API_BASE);

function environmentConfigConvert(
  config: EnvironmentConfig
): IEnvironmentConfig {
  return {
    name: config.name,
    version: config.version || null,
    isObservationEnabled:
      typeof config.isEnabled === "undefined" ? null : config.isEnabled,
    isMultiTenant:
      typeof config.isMultitenant === "undefined" ? null : config.isMultitenant,
    kubernetesApi: config.kubernetesApi || null
  };
}

export const getEnvironmentConfigsOperation = asyncActionCreator<
  {},
  { configs: IEnvironmentConfig[] }
>("GET_ENVIRONMENT_CONFIGS", () =>
  collectClient
    .listEnvironmentConfig()
    .then((configResults: EnvironmentConfig[]) => {
      const configs = configResults.map(config =>
        environmentConfigConvert(config)
      );
      return { configs };
    })
);

export const postEnvironmentConfigOperation = asyncActionCreator<
  {
    environmentName: string;
    isMultitenant: boolean;
    kubernetesApi: string;
    version: string;
  },
  { config: IEnvironmentConfig }
>(
  "POST_ENVIRONMENT_CONFIG",
  ({ environmentName, isMultitenant, kubernetesApi, version }) =>
    collectClient
      .putEnvironmentConfig(
        environmentName,
        {
          name: environmentName,
          isMultitenant,
          kubernetesApi,
          version
        },
        {
          headers: {
            "Content-Type": "application/json"
          } // This is due to "typescript-fetch")
        }
      )
      .then((configResult: EnvironmentConfig) => {
        const config = environmentConfigConvert(configResult);
        return { config };
      })
);

export const addEnvironmentConfigOperation = asyncActionCreator<
  {
    environmentName: string;
    isMultitenant: boolean;
    kubernetesApi: string;
    version: string;
  },
  { config: IEnvironmentConfig }
>(
  "Add_ENVIRONMENT_CONFIG",
  ({ environmentName, isMultitenant, kubernetesApi, version }) =>
    collectClient
      .addEnvironmentConfig(
        {
          name: environmentName,
          isMultitenant,
          kubernetesApi,
          version
        },
        {
          headers: {
            "Content-Type": "application/json"
          } // This is due to "typescript-fetch")
        }
      )
      .then((newConfig: EnvironmentConfig) => {
        const config = environmentConfigConvert(newConfig);
        return { config };
      })
);

export function reducer(state: IState = INIT, action: Action): IState {
  if (isType(action, getEnvironmentConfigsOperation.async.done)) {
    return { ...state, environmentConfigs: action.payload.result.configs };
  }
  return state;
}
