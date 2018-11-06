import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";
import { IEnvironmentConfig } from "../store";

const actionCreator = actionCreatorFactory();
const asyncActionCreator = asyncFactory(actionCreator);

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  COLLECT_API_BASE
);

function environmentConfigConvert(
  config: collect.EnvironmentConfig
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
    .then((configResults: collect.EnvironmentConfig[]) => {
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
      .then((configResult: collect.EnvironmentConfig) => {
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
      .then((newConfig: collect.EnvironmentConfig) => {
        const config = environmentConfigConvert(newConfig);
        return { config };
      })
);
