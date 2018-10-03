import * as React from "react";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./TitleBar";
import Toastr from "./Toastr";
import Workspace from "./Workspace";

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

export default App;
