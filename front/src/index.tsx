import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { APP_NAME } from "./constants";
import App from "./containers/App";
import index from "./store/index";
import "./wapicon/style.css";

render(
  <Provider store={index}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);

document.title = APP_NAME;
