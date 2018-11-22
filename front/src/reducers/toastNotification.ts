import { Action } from "redux";
import { isType } from "typescript-fsa";
import { hideToastr, removeToastr, showToastr } from "../actions";
import { IToastNotificationState } from "../store";

const INIT: IToastNotificationState = {
  notifications: []
};

export function toastNotification(
  state: IToastNotificationState = INIT,
  action: Action
): IToastNotificationState {
  if (isType(action, showToastr)) {
    return {
      ...state,
      notifications: [
        {
          isShown: true,
          message: action.payload.message,
          kind: action.payload.kind,
          id: action.payload.id
        },
        ...state.notifications
      ]
    };
  }
  if (isType(action, hideToastr)) {
    return {
      ...state,
      notifications: state.notifications.map(x =>
        x.id === action.payload.id ? { ...x, isShown: false } : x
      )
    };
  }
  if (isType(action, removeToastr)) {
    return {
      ...state,
      notifications: state.notifications.filter(x => x.id !== action.payload.id)
    };
  }
  return state;
}
