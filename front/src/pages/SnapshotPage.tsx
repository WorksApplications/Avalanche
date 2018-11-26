import * as React from "react";
import SnapshotsView from "../containers/SnapshotsView";
import styles from "./SnapshotPage.scss";

const RunningPodsView = React.lazy(() =>
  import(/* webpackChunkName: "pods-view" */ "../containers/RunningPodsView")
);

export class SnapshotPage extends React.Component {
  private viewRef = React.createRef<any>();

  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.snapshots}>
          <SnapshotsView ref={this.viewRef} />
        </div>
        <div className={styles.pods}>
          <React.Suspense fallback={<div className={styles.podsViewLoading} />}>
            <RunningPodsView snapshotCreated={this.onUpdate} />
          </React.Suspense>
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
