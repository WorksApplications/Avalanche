import { Action, ActionCreator, Dispatch } from "redux";
import * as collect from "../generated/collect/api";

export const SELECT_APP = "SELECT_APP";
export const GET_APPS_REQUEST = "GET_APPS_REQUEST";
export const GET_APPS_RECEIVE = "GET_APPS_RECEIVE";
export const GET_ENVS_OF_APP_REQUEST = "GET_ENVS_OF_APP_REQUEST";
export const GET_ENVS_OF_APP_RECEIVE = "GET_ENVS_OF_APP_RECEIVE";

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  "http://flamescope.internal.worksap.com:31002"
);

export interface IAction {
  type: string;
  payload?: any;
}

export const selectApp: ActionCreator<Action> = (appName: string) => {
  return {
    type: SELECT_APP,
    payload: {
      appName
    }
  };
};

const requestGetApps: ActionCreator<Action> = () => {
  return {
    type: GET_APPS_REQUEST
  };
};

const receiveGetApps: ActionCreator<Action> = (apps: string[]) => {
  return {
    type: GET_APPS_RECEIVE,
    payload: {
      apps
    }
  };
};

export const getApps = () => (dispatch: Dispatch) => {
  dispatch(requestGetApps());
  collectClient.getApps().then(apps => {
    dispatch(receiveGetApps(apps));
  });
  // TODO catch
};

const requestGetEnvsOfApp: ActionCreator<Action> = (app: string) => {
  return {
    type: GET_ENVS_OF_APP_REQUEST,
    payload: {
      app
    }
  };
};

const receiveGetEnvsOfApp: ActionCreator<Action> = (
  appName: string,
  envs: collect.Environment[]
) => {
  return {
    type: GET_ENVS_OF_APP_RECEIVE,
    payload: {
      environments: envs
    }
  };
};

export const getEnvironmentsOfApp = (app: string) => (dispatch: Dispatch) => {
  dispatch(requestGetEnvsOfApp());
  collectClient.getEnvironments(app).then(envs => {
    dispatch(receiveGetEnvsOfApp(app, envs));
  });
  // TODO catch
};
