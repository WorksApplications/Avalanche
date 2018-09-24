import { Dispatch } from "redux";
import actionCreatorFactory from "typescript-fsa";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";

const actionCreator = actionCreatorFactory();

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  COLLECT_API_BASE
);

export const selectApp = actionCreator<{ appName: string }>("SELECT_APP");

export const selectEnv = actionCreator<{ envName: string | null }>(
  "SELECT_ENV"
);

export const selectPod = actionCreator<{ podName: string | null }>(
  "SELECT_POD"
);

export const getAppsAsyncAction = actionCreator.async<
  {},
  { apps: string[] },
  { message: string }
>("GET_APPS");

export const getApps = () => (dispatch: Dispatch) => {
  const params = {};
  dispatch(getAppsAsyncAction.started(params));
  collectClient
    .getApps()
    .then((apps: string[]) => {
      dispatch(getAppsAsyncAction.done({ params, result: { apps } }));
    })
    .catch((reason: Error) => {
      dispatch(
        getAppsAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to get app names.`, "error")(dispatch);
    });
};

export const getEnvironmentsOfAppAsyncAction = actionCreator.async<
  { app: string },
  { envs: collect.Environment[] },
  { message: string }
>("GET_ENVS_OF_APP");

export const getEnvironmentsOfApp = (app: string) => (dispatch: Dispatch) => {
  const params = { app };
  dispatch(getEnvironmentsOfAppAsyncAction.started(params));
  collectClient
    .getEnvironments(app)
    .then((envs: collect.Environment[]) => {
      dispatch(
        getEnvironmentsOfAppAsyncAction.done({ params, result: { envs } })
      );
    })
    .catch((reason: Error) => {
      dispatch(
        getEnvironmentsOfAppAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to get environment info of "${params.app}".`, "error")(
        dispatch
      );
    });
};

export const getRunningPodsAsyncAction = actionCreator.async<
  {},
  { pods: collect.Pod[] },
  { message: string }
>("GET_RUNNING_PODS");

export const getRunningPods = () => (dispatch: Dispatch) => {
  const params = {};
  dispatch(getRunningPodsAsyncAction.started(params));
  collectClient
    .listAvailablePods()
    .then((pods: collect.Pod[]) => {
      dispatch(getRunningPodsAsyncAction.done({ params, result: { pods } }));
    })
    .catch((reason: Error) => {
      dispatch(
        getRunningPodsAsyncAction.failed({
          params,
          error: { message: reason.message }
        })
      );
      toastr(`Failed to get running pod info.`, "error")(dispatch);
    });
};

export const postSnapshotAsyncAction = actionCreator.async<
  {
    appId: string;
    environment: string;
    podId: string;
  },
  { newSnapshot: collect.Snapshot },
  { message: string }
>("POST_NEW_SNAPSHOT");

export const postSnapshot = (
  appId: string,
  environment: string,
  podId: string
) => (dispatch: Dispatch) => {
  const params = { appId, environment, podId };
  dispatch(postSnapshotAsyncAction.started(params));
  collectClient
    .newSnapshot(appId, environment, podId, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch"
    })
    .then((snapshot: collect.Snapshot) => {
      dispatch(
        postSnapshotAsyncAction.done({
          params,
          result: { newSnapshot: snapshot }
        })
      );
      toastr(`New snapshot for "${params.podId}" is created.`, "success")(
        dispatch
      );
    })
    .catch((reason: Error) => {
      postSnapshotAsyncAction.failed({
        params,
        error: { message: reason.message }
      });
      toastr(`Failed to make a new snapshot for "${params.podId}".`, "error")(
        dispatch
      );
    });
};

export const showToastr = actionCreator<{
  message: string;
  kind: "success" | "error";
  id: number;
}>("SHOW_TOASTR");

export const hideToastr = actionCreator<{ id: number }>("HIDE_TOASTR");

export const toastr = (
  message: string,
  kind: "success" | "error",
  duration: number = 3000
) => (dispatch: Dispatch) => {
  const id = Math.random();
  dispatch(showToastr({ message, kind, id }));
  setTimeout(() => {
    dispatch(hideToastr({ id }));
  }, duration);
};

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
