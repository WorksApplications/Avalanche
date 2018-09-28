import { Component, h } from "preact";
import MainArea from "../containers/MainArea";
import RunningPodsView from "../containers/RunningPodsView";
// @ts-ignore
import styles from "./SnapshotPage.scss";

class SnapshotPage extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.snapshots}>
          <MainArea />
        </div>
        <div className={styles.pods}>
          <RunningPodsView />
        </div>
      </div>
    );
  }
}

export default SnapshotPage;
