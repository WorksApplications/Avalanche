import { Dispatch } from "redux";
import actionCreatorFactory from "typescript-fsa";

const actionCreator = actionCreatorFactory();

export const showToastr = actionCreator<{
  message: string;
  kind: "success" | "error";
  id: number;
}>("SHOW_TOASTR");

export const hideToastr = actionCreator<{ id: number }>("HIDE_TOASTR");

export const toastr = (
  message: string,
  kind: "success" | "error",
  duration: number = 3000
) => (dispatch: Dispatch) => {
  const id = Math.random();
  dispatch(showToastr({ message, kind, id }));
  setTimeout(() => {
    dispatch(hideToastr({ id }));
  }, duration);
};
