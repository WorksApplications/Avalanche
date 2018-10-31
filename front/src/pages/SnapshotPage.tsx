import * as React from "react";
import RunningPodsView from "../containers/RunningPodsView";
import SnapshotsView from "../containers/SnapshotsView";
import styles from "./SnapshotPage.scss";

class SnapshotPage extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.snapshots}>
          <SnapshotsView />
        </div>
        <div className={styles.pods}>
          <RunningPodsView />
        </div>
      </div>
    );
  }
}

export default SnapshotPage as React.ComponentClass;
