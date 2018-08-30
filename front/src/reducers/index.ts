import { combineReducers } from "redux";
import { IApplicationState } from "../store";
import { analysisData } from "./analysisData";
import { environmentConfig } from "./environmentConfig";
import { toastNotification } from "./toastNotification";

export default combineReducers<IApplicationState>({
  analysisData,
  toastNotification,
  environmentConfig
});
