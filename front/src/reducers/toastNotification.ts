/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
