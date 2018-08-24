import { combineReducers } from "redux";
import { IApplicationState } from "../store";
import { analysisData } from "./analysisData";
import { toastNotification } from "./toastNotification";

export default combineReducers<IApplicationState>({
  analysisData,
  toastNotification
});
