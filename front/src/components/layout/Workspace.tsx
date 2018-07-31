import { Component, h } from "preact";
import MainArea from "./MainArea";
import NavigationView from "./NavigationView";
import RunningPodsView from "./RunningPodsView";
// @ts-ignore
import styles from "./Workspace.scss";

class Workspace extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.left}>
          <NavigationView />
        </div>
        <div className={styles.right}>
          <RunningPodsView />
        </div>
        <div className={styles.middle}>
          <MainArea />
        </div>
      </div>
    );
  }
}

export default Workspace;
