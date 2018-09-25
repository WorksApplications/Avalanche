import { Action } from "redux";
import { isType } from "typescript-fsa";
import { getEnvironmentConfigsAsyncAction } from "../actions";
import { IEnvironmentConfigState } from "../store";

const INIT: IEnvironmentConfigState = {
  environmentConfigs: []
};

export function environmentConfig(
  state: IEnvironmentConfigState = INIT,
  action: Action
): IEnvironmentConfigState {
  if (isType(action, getEnvironmentConfigsAsyncAction.done)) {
    return { ...state, environmentConfigs: action.payload.result.configs };
  }
  return state;
}
