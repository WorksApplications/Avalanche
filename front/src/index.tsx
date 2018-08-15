import { h, render } from "preact";
import { Provider } from "preact-redux";
import { APP_NAME } from "./constants";
import App from "./containers/App";
import index from "./store/index";

render(
  <Provider store={index}>
    <App />
  </Provider>,
  document.body
);

document.title = APP_NAME;
