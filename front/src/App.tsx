import * as React from "react";
import { hot } from "react-hot-loader";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./containers/TitleBar";
import Toastr from "./containers/Toastr";
import Workspace from "./containers/Workspace";

class App extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.title}>
          <TitleBar />
        </div>
        <div className={styles.content}>
          <Workspace />
        </div>
        <Toastr />
      </div>
    );
  }
}

export default hot(module)(App);
