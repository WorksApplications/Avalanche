import { Action } from "redux";
import { isType } from "typescript-fsa";
import { hideToastr, showToastr } from "../actions";
import { IToastNotificationState } from "../store";

const INIT: IToastNotificationState = {
  isShown: false,
  message: null,
  kind: "error",
  id: null
};

export function toastNotification(
  state: IToastNotificationState = INIT,
  action: Action
): IToastNotificationState {
  if (isType(action, showToastr)) {
    return {
      ...state,
      isShown: true,
      message: action.payload.message,
      kind: action.payload.kind,
      id: action.payload.id
    };
  }
  if (isType(action, hideToastr)) {
    if (action.payload.id === state.id) {
      return { ...state, isShown: false };
    }
    return state;
  }
  return state;
}
