import { ConnectedRouter } from "connected-react-router";
import * as React from "react";
import { render } from "react-dom";
import * as ReactModal from "react-modal";
import { Provider } from "react-redux";
import App from "./App";
import { APP_NAME } from "./constants";
import store, { history } from "./store/index";
import "./wapicon/style.css";

ReactModal.setAppElement("#root");

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root")
);

document.title = APP_NAME;
