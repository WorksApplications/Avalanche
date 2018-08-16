import { Action, ActionCreator, Dispatch } from "redux";
import actionCreatorFactory from "typescript-fsa";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";

export const GET_ENVS_OF_APP_REQUEST = "GET_ENVS_OF_APP_REQUEST";
export const GET_ENVS_OF_APP_RECEIVE = "GET_ENVS_OF_APP_RECEIVE";
export const GET_RUNNING_PODS_REQUEST = "GET_RUNNING_PODS_REQUEST";
export const GET_RUNNING_PODS_RECEIVE = "GET_RUNNING_PODS_RECEIVE";
export const POST_NEW_SNAPSHOT_REQUEST = "POST_NEW_SNAPSHOT_REQUEST";
export const POST_NEW_SNAPSHOT_RECEIVE = "POST_NEW_SNAPSHOT_RECEIVE";

const actionCreator = actionCreatorFactory();

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  COLLECT_API_BASE
);

export interface IAction {
  type: string;
  payload?: any;
}

export const selectApp = actionCreator<{ appName: string }>("SELECT_APP");

export const selectEnv = actionCreator<{ envName: string | null }>(
  "SELECT_ENV"
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
    });
};

const requestGetEnvsOfApp: ActionCreator<Action> = (app: string) => ({
  type: GET_ENVS_OF_APP_REQUEST,
  payload: {
    app
  }
});

const receiveGetEnvsOfApp: ActionCreator<Action> = (
  appName: string,
  envs: collect.Environment[]
) => ({
  type: GET_ENVS_OF_APP_RECEIVE,
  payload: {
    environments: envs
  }
});

export const getEnvironmentsOfApp = (app: string) => (dispatch: Dispatch) => {
  dispatch(requestGetEnvsOfApp());
  collectClient.getEnvironments(app).then(envs => {
    dispatch(receiveGetEnvsOfApp(app, envs));
  });
  // TODO catch
};

const requestGetRunningPods: ActionCreator<Action> = () => ({
  type: GET_RUNNING_PODS_REQUEST
});

const receiveGetRunningPods: ActionCreator<Action> = (pods: collect.Pod[]) => ({
  type: GET_RUNNING_PODS_RECEIVE,
  payload: {
    pods
  }
});

export const getRunningPods = () => (dispatch: Dispatch) => {
  dispatch(requestGetRunningPods());
  collectClient.listAvailablePods().then(pods => {
    dispatch(receiveGetRunningPods(pods));
  });
  // TODO catch
};

const requestPostSnapshot: ActionCreator<Action> = () => ({
  type: POST_NEW_SNAPSHOT_REQUEST
});

const receivePostSnapshot: ActionCreator<Action> = (
  snapshot: collect.Snapshot
) => ({
  type: POST_NEW_SNAPSHOT_RECEIVE,
  payload: {
    newSnapshot: snapshot
  }
});

export const postSnapshot = (
  appId: string,
  environment: string,
  podId: string
) => (dispatch: Dispatch) => {
  dispatch(requestPostSnapshot());
  collectClient
    .newSnapshot(appId, environment, podId, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch"
    })
    .then(snapshots => {
      dispatch(receivePostSnapshot(snapshots));
    });
  // TODO catch
};
