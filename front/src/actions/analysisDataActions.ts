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
