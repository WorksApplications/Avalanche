import { combineReducers } from "redux";
import { analysisData } from "./analysisData";
import { environmentConfig } from "./environmentConfig";
import { toastNotification } from "./toastNotification";

export default combineReducers({
  analysisData,
  toastNotification,
  environmentConfig
});
