import * as React from "react";
import RunningPodsView from "../containers/RunningPodsView";
import SnapshotsView from "../containers/SnapshotsView";
import styles from "./SnapshotPage.scss";

export class SnapshotPage extends React.Component {
  private viewRef = React.createRef<any>();

  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.snapshots}>
          <SnapshotsView ref={this.viewRef} />
        </div>
        <div className={styles.pods}>
          <RunningPodsView snapshotCreated={this.onUpdate} />
        </div>
      </div>
    );
  }
  private onUpdate = () => {
    // questionable impl...
    if (this.viewRef.current && this.viewRef.current.getWrappedInstance) {
      const viewInstance = this.viewRef.current.getWrappedInstance();
      if (viewInstance) {
        viewInstance.reloadView();
      }
    }
  };
}

export default SnapshotPage;
