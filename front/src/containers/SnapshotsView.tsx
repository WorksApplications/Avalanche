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
import { push } from "connected-react-router";
import * as qs from "querystring";
import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  getAppsOperation,
  getEnvironmentsOfAppOperation,
  getHeatMapOperation,
  getLatestSnapshotsOperation,
  getPerfCallTreeOperation,
  toastr
} from "../actions";
import AppSelector from "../components/AppSelector";
import SnapshotFilter from "../components/SnapshotFilter";
import SnapshotList, { ISnapshotData } from "../components/SnapshotList";
import {
  normalizedToFlamescopePosition,
  operationsToActionCreators
} from "../helpers";
import { IApplicationState, ISnapshotInfo } from "../store";
import styles from "./SnapshotsView.scss";

function sortedApplications(applications: string[]): string[] {
  return applications.sort();
}

function sortedSnapshots(snapshots: ISnapshotInfo[]): ISnapshotInfo[] {
  return snapshots.sort((a, b) => {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }

    if (!a.createdAt) {
      return 1;
    }
    if (!b.createdAt) {
      return -1;
    }

    // newer pod first
    const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    if (!a.name) {
      return 1;
    }

    if (!b.name) {
      return -1;
    }

    // dictionary order
    return a.name > b.name ? 1 : -1;
  });
}

const mapStateToProps = (state: IApplicationState) => ({
  appName: state.analysisData.applicationName,
  apps: sortedApplications(state.analysisData.applications),
  environments: state.analysisData.environments,
  filteringEnvironment: state.analysisData.selectedEnvironment,
  filteringPod: state.analysisData.selectedPod,
  pods: state.analysisData.pods,
  snapshots: sortedSnapshots(state.analysisData.snapshots),
  heatMaps: state.analysisData.heatMaps,
  perfCallTrees: state.analysisData.perfCallTrees
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      toastr,
      pushHistory: push,
      ...operationsToActionCreators({
        getAppsOperation,
        getEnvironmentsOfAppOperation,
        getLatestSnapshotsOperation,
        getHeatMapOperation,
        getPerfCallTreeOperation
      })
    },
    dispatch
  );

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

export class SnapshotsView extends React.Component<Props> {
  public componentDidMount() {
    this.props.getAppsOperation().catch(() => {
      this.props.toastr(`Failed to get app names.`, "error");
    });

    this.reloadView();
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.appName !== this.props.appName) {
      this.reloadView();
    }
  }

  public reloadView() {
    if (this.props.appName) {
      this.props
        .getEnvironmentsOfAppOperation({ app: this.props.appName })
        .catch(() => {
          this.props.toastr(
            `Failed to get environment info of ${this.props.appName}`,
            "error"
          );
        });
    } else {
      this.props.getLatestSnapshotsOperation({ count: 10 }).catch(() => {
        this.props.toastr(`Failed to get latest snapshots.`, "error");
      });
    }
  }

  public render() {
    const showingApps = this.props.apps.map(x => ({
      label: x,
      value: x
    }));

    const environmentNames: string[] = Object.keys(
      this.props.environments || {}
    );
    const podNames: string[] = this.props.pods
      .filter(x => x.snapshots && x.snapshots.length !== 0)
      .map(x => x.name);

    const envFilterData = environmentNames.map(x => ({ label: x, value: x }));
    const podFilterData = podNames.map(x => ({ label: x, value: x }));

    let emptyMessage =
      this.props.snapshots.length > 0 ? "Please select environment" : "No Data";
    let showingSnapshots: ISnapshotData[] = [];

    if (this.props.snapshots.length > 0) {
      showingSnapshots = this.props.snapshots.map(x => {
        const heatMap = this.props.heatMaps.get(x.heatMapId);
        const perfCallTree = this.props.perfCallTrees.get(x.uuid);
        return {
          uuid: x.uuid,
          environment: x.environment || "Unknown",
          podName: x.pod || "Unknown",
          createdAt: x.createdAt,
          link: x.link || "#",
          heatMap: heatMap && heatMap.data,
          heatMapId: x.heatMapId,
          heatMapStatus: heatMap ? heatMap.status : "empty",
          onRangeSelect: this.onRangeSelectWrap,
          getHeatMap: this.getHeatMapWrap,
          perfCallTree: perfCallTree && perfCallTree.data,
          perfCallTreeStatus: perfCallTree ? perfCallTree.status : "empty"
        };
      });
      if (this.props.filteringEnvironment) {
        showingSnapshots = showingSnapshots.filter(
          x => x.environment === this.props.filteringEnvironment
        );
      }
      if (this.props.filteringPod) {
        showingSnapshots = showingSnapshots.filter(
          x => x.podName === this.props.filteringPod
        );
      }
      if (showingSnapshots.length === 0) {
        emptyMessage = "No Data";
      }
    }

    return (
      <div className={styles.wrap}>
        <div className={styles.appContext}>
          <div className={styles.label}>Application Context</div>
          <div className={styles.selector}>
            <AppSelector
              options={showingApps}
              selectedValue={this.props.appName}
              onValueChanged={this.onAppChanged}
              unselectOptionLabel="Unselect"
              placeholder="Select Application"
            />
          </div>
        </div>
        <div className={styles.innerWrap}>
          <div className={styles.environmentSelector}>
            <SnapshotFilter
              options={envFilterData}
              selectedValue={this.props.filteringEnvironment}
              onValueChanged={this.onEnvironmentChanged}
              placeholder="Select environment"
              unselectOptionLabel="Unselect"
              disabled={!this.props.appName}
            />
          </div>
          <div className={styles.podSelector}>
            <SnapshotFilter
              options={podFilterData}
              selectedValue={this.props.filteringPod}
              onValueChanged={this.onPodChanged}
              placeholder="Select pod name"
              unselectOptionLabel="Unselect"
              disabled={!this.props.filteringEnvironment}
            />
          </div>
          <div className={styles.snapshotList}>
            <SnapshotList rows={showingSnapshots} emptyMessage={emptyMessage} />
          </div>
        </div>
      </div>
    );
  }

  private onRangeSelectWrap = (
    snapshotId: string,
    heatMapId: string,
    normalizedStart: number,
    normalizedEnd: number
  ) => {
    const heatMap = this.props.heatMaps.get(heatMapId);
    if (heatMap && heatMap.data) {
      const startPosition = normalizedToFlamescopePosition(
        normalizedStart,
        heatMap.data.numColumns,
        heatMap.data.numRows
      );
      const endPosition = normalizedToFlamescopePosition(
        normalizedEnd,
        heatMap.data.numColumns,
        heatMap.data.numRows
      );

      this.props
        .getPerfCallTreeOperation({ snapshotId, startPosition, endPosition })
        .catch(() => {
          this.props.toastr(
            `Failed to get perf call tree of ${heatMapId} in [${startPosition}, ${endPosition}].`,
            "error"
          );
        });
    }
  };

  private getHeatMapWrap = (snapshotId: string, heatMapId: string) => {
    this.props.getHeatMapOperation({ snapshotId, heatMapId }).catch(() => {
      this.props.toastr(`Failed to get heat map for "${snapshotId}".`, "error");
    });
  };

  private onAppChanged = (app: string) => {
    this.pushParams({ newApp: app, newEnv: null, newPod: null });
  };

  private onEnvironmentChanged = (env: string) => {
    this.pushParams({ newEnv: env, newPod: null });
  };

  private onPodChanged = (pod: string) => {
    this.pushParams({ newPod: pod });
  };

  private pushParams(params: {
    newApp?: string | null;
    newEnv?: string | null;
    newPod?: string | null;
  }) {
    const app =
      typeof params.newApp === "undefined" ? this.props.appName : params.newApp;
    const env =
      app &&
      (typeof params.newEnv === "undefined"
        ? this.props.filteringEnvironment
        : params.newEnv);
    const pod =
      env &&
      (typeof params.newPod === "undefined"
        ? this.props.filteringPod
        : params.newPod);
    const searchParams = { app, env, pod };
    Object.keys(searchParams).forEach(
      key =>
        (typeof searchParams[key] === "undefined" ||
          searchParams[key] === null) &&
        delete searchParams[key]
    );
    this.props.pushHistory({
      search: `?${qs.stringify(searchParams)}`
    });
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  // @ts-ignore
  { forwardRef: true }
)(SnapshotsView);
