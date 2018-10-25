import { History } from "history";
import * as React from "react";
import RunningPodsView from "../containers/RunningPodsView";
import SnapshotsView from "../containers/SnapshotsView";
import styles from "./SnapshotPage.scss";

interface IDerivedProperties {
  history: History;
}

class SnapshotPage extends React.Component<IDerivedProperties> {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.snapshots}>
          <SnapshotsView history={this.props.history} />
        </div>
        <div className={styles.pods}>
          <RunningPodsView />
        </div>
      </div>
    );
  }
}

export default SnapshotPage as React.ComponentClass;
