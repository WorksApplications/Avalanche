import { Dispatch } from "redux";
import actionCreatorFactory, { Meta } from "typescript-fsa";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";
import { IEnvironmentConfig } from "../store";

const actionCreator = actionCreatorFactory();

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

export const getEnvironmentConfigsAsyncAction = actionCreator.async<
  {},
  { configs: IEnvironmentConfig[] },
  { message: string }
>("GET_ENVIRONMENT_CONFIGS");

export const getEnvironmentConfigs = (meta?: Meta) => (
  dispatch: Dispatch
): Promise<{ configs: IEnvironmentConfig[] }> => {
  const params = {};
  dispatch(getEnvironmentConfigsAsyncAction.started(params, meta));
  return collectClient
    .listEnvironmentConfig()
    .then((configResults: collect.EnvironmentConfig[]) => {
      const configs = configResults.map(config =>
        environmentConfigConvert(config)
      );
      const result = { configs };
      dispatch(getEnvironmentConfigsAsyncAction.done({ params, result }, meta));
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        getEnvironmentConfigsAsyncAction.failed(
          {
            params,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};

export const postEnvironmentConfigAsyncAction = actionCreator.async<
  {
    environment: string;
  },
  { config: IEnvironmentConfig },
  { message: string }
>("POST_ENVIRONMENT_CONFIG");

export const postEnvironmentConfig = (
  params: {
    environmentName: string;
    isMultitenant: boolean;
    kubernetesApi: string;
    version: string;
  },
  meta?: Meta
) => (dispatch: Dispatch): Promise<{ config: IEnvironmentConfig }> => {
  const newConfig: collect.EnvironmentConfig = {
    name: params.environmentName,
    isMultitenant: params.isMultitenant,
    kubernetesApi: params.kubernetesApi,
    version: params.version
  };
  const newParams = { environment: params.environmentName, config: newConfig };
  dispatch(postEnvironmentConfigAsyncAction.started(newParams, meta));
  return collectClient
    .putEnvironmentConfig(params.environmentName, newConfig, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch")
    })
    .then((configResult: collect.EnvironmentConfig) => {
      const config = environmentConfigConvert(configResult);
      const result = { config };
      dispatch(
        postEnvironmentConfigAsyncAction.done(
          { params: newParams, result },
          meta
        )
      );
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        postEnvironmentConfigAsyncAction.failed(
          {
            params: newParams,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};

export const addEnvironmentConfigAsyncAction = actionCreator.async<
  {
    environment: string;
  },
  { config: IEnvironmentConfig },
  { message: string }
>("Add_ENVIRONMENT_CONFIG");

export const addEnvironmentConfig = (
  params: {
    environmentName: string;
    isMultitenant: boolean;
    kubernetesApi: string;
    version: string;
  },
  meta?: Meta
) => (dispatch: Dispatch): Promise<{ config: IEnvironmentConfig }> => {
  const newConfig: collect.EnvironmentConfig = {
    name: params.environmentName,
    isMultitenant: params.isMultitenant,
    kubernetesApi: params.kubernetesApi,
    version: params.version
  };
  const newParams = { environment: params.environmentName, config: newConfig };
  dispatch(addEnvironmentConfigAsyncAction.started(newParams, meta));
  return collectClient
    .addEnvironmentConfig(newConfig, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch")
    })
    .then((config: collect.EnvironmentConfig) => {
      const result = { config: environmentConfigConvert(config) };
      dispatch(
        addEnvironmentConfigAsyncAction.done({ params: newParams, result })
      );
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        addEnvironmentConfigAsyncAction.failed({
          params: newParams,
          error: { message: reason.message }
        })
      );
      throw reason;
    });
};
