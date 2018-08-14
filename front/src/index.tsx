import { h, render } from "preact";
import { Provider } from "preact-redux";
import App from "./containers/App";
import index from "./store/index";

render(
  <Provider store={index}>
    <App />
  </Provider>,
  document.body
);
