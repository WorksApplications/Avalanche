import { Dispatch } from "redux";
import actionCreatorFactory from "typescript-fsa";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";
import { toastr } from "./toastNotificationActions";

const actionCreator = actionCreatorFactory();

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  COLLECT_API_BASE
);

export const getEnvironmentConfigsAsyncAction = actionCreator.async<
  {},
  { configs: collect.EnvironmentConfig[] },
  { message: string }
>("GET_ENVIRONMENT_CONFIGS");

export const getEnvironmentConfigs = () => (dispatch: Dispatch) => {
  const params = {};
  dispatch(getEnvironmentConfigsAsyncAction.started(params));
  collectClient
    .listEnvironmentConfig()
    .then((configs: collect.EnvironmentConfig[]) => {
      dispatch(
        getEnvironmentConfigsAsyncAction.done({ params, result: { configs } })
      );
    })
    .catch((reason: Error) => {
      dispatch(
        getEnvironmentConfigsAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to get environment configs.`, "error")(dispatch);
    });
};

export const postEnvironmentConfigAsyncAction = actionCreator.async<
  {
    environment: string;
  },
  { config: collect.EnvironmentConfig },
  { message: string }
>("POST_ENVIRONMENT_CONFIG");

export const postEnvironmentConfig = (
  environmentName: string,
  isMultitenant: boolean,
  kubernetesApi: string,
  version: string
) => (dispatch: Dispatch) => {
  const newConfig: collect.EnvironmentConfig = {
    name: environmentName,
    isMultitenant,
    kubernetesApi,
    version
  };
  const params = { environment: environmentName, config: newConfig };
  dispatch(postEnvironmentConfigAsyncAction.started(params));
  collectClient
    .putEnvironmentConfig(environmentName, newConfig, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch")
    })
    .then((config: collect.EnvironmentConfig) => {
      dispatch(
        postEnvironmentConfigAsyncAction.done({
          params,
          result: { config }
        })
      );
      toastr(`Config for "${params.environment}" is updated.`, "success")(
        dispatch
      );
    })
    .catch((reason: Error) => {
      dispatch(
        postEnvironmentConfigAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to configure "${params.environment}".`, "error")(dispatch);
    });
};

export const addEnvironmentConfigAsyncAction = actionCreator.async<
  {
    environment: string;
  },
  { config: collect.EnvironmentConfig },
  { message: string }
>("Add_ENVIRONMENT_CONFIG");

export const addEnvironmentConfig = (
  environmentName: string,
  isMultitenant: boolean,
  kubernetesApi: string,
  version: string
) => (dispatch: Dispatch) => {
  const newConfig: collect.EnvironmentConfig = {
    name: environmentName,
    isMultitenant,
    kubernetesApi,
    version
  };
  const params = { environment: environmentName, config: newConfig };
  dispatch(addEnvironmentConfigAsyncAction.started(params));
  collectClient
    .addEnvironmentConfig(newConfig, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch")
    })
    .then((config: collect.EnvironmentConfig) => {
      dispatch(
        addEnvironmentConfigAsyncAction.done({ params, result: { config } })
      );
      toastr(`Config for "${params.environment}" is added.`, "success")(
        dispatch
      );
    })
    .catch((reason: Error) => {
      dispatch(
        addEnvironmentConfigAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to add "${params.environment}".`, "error")(dispatch);
    });
};
