/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
