/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
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
import { Dispatch } from "redux";
import actionCreatorFactory from "typescript-fsa";

const actionCreator = actionCreatorFactory();

export const showToastr = actionCreator<{
  message: string;
  kind: "success" | "error";
  id: number;
}>("SHOW_TOASTR");

export const hideToastr = actionCreator<{ id: number }>("HIDE_TOASTR");

export const removeToastr = actionCreator<{ id: number }>("REMOVE_TOASTR");

export const toastr = (
  message: string,
  kind: "success" | "error",
  duration: number = 3000
) => (dispatch: Dispatch) => {
  const id = Math.random();
  dispatch(showToastr({ message, kind, id }));
  setTimeout(() => {
    dispatch(hideToastr({ id }));
    setTimeout(() => {
      dispatch(removeToastr({ id }));
    }, 200);
  }, duration);
};
