import { Component, h } from "preact";
import MainArea from "./MainArea";
import RunningPodsView from "./RunningPodsView";
// @ts-ignore
import styles from "./SnapshotPage.scss";

class SnapshotPage extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.pods}>
          <RunningPodsView />
        </div>
        <div className={styles.snapshots}>
          <MainArea />
        </div>
      </div>
    );
  }
}

export default SnapshotPage;
