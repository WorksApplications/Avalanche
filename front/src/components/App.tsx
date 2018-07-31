import { Component, h } from "preact";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./layout/TitleBar";
import Workspace from "./layout/Workspace";

class App extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.title}>
          <TitleBar />
        </div>
        <div className={styles.content}>
          <Workspace />
        </div>
      </div>
    );
  }
}

export default App;
