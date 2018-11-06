import { Action } from "redux";
import { isType } from "typescript-fsa";
import { getEnvironmentConfigsOperation } from "../actions";
import { IEnvironmentConfigState } from "../store";

const INIT: IEnvironmentConfigState = {
  environmentConfigs: []
};

export function environmentConfig(
  state: IEnvironmentConfigState = INIT,
  action: Action
): IEnvironmentConfigState {
  if (isType(action, getEnvironmentConfigsOperation.async.done)) {
    return { ...state, environmentConfigs: action.payload.result.configs };
  }
  return state;
}
