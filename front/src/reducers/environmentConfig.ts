import { Action } from "redux";
import { isType } from "typescript-fsa";
import { getEnvironmentConfigsAsyncAction } from "../actions";
import { IEnvironmentConfig, IEnvironmentConfigState } from "../store";

const INIT: IEnvironmentConfigState = {
  environmentConfigs: []
};

export function environmentConfig(
  state: IEnvironmentConfigState = INIT,
  action: Action
): IEnvironmentConfigState {
  if (isType(action, getEnvironmentConfigsAsyncAction.done)) {
    // tslint:disable:no-string-literal
    const environmentConfigs: IEnvironmentConfig[] = action.payload.result.configs.map(
      c => ({
        name: c.name,
        version: c.version || null,
        isObservationEnabled:
          typeof c.isEnabled === "undefined" ? null : c.isEnabled,
        isMultiTenant:
          typeof c.isMultitenant === "undefined" ? null : c.isMultitenant,
        kubernetesApi: c.kubernetesApi || null
      })
    );
    return { ...state, environmentConfigs };
  }
  return state;
}
