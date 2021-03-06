/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
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
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import PodCardList, { IPodCardListData } from "../components/PodCardList";
import PodFilter from "../components/PodFilter";
import { operationsToActionCreators } from "../helpers";
import {
  getRunningPodsOperation,
  postSnapshotOperation
} from "../modules/analysisData";
import { toastr } from "../modules/toastNotification";
import { IApplicationState } from "../store";
import styles from "./RunningPodsView.scss";

const initialState = {
  filteringValue: ""
};

type State = Readonly<typeof initialState>;

const mapStateToProps = (state: IApplicationState) => ({
  applicationName: state.analysisData.applicationName,
  pods: state.analysisData.runningPods
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      toastr,
      ...operationsToActionCreators({
        getRunningPodsOperation,
        postSnapshotOperation
      })
    },
    dispatch
  );

interface IComponentProps {
  snapshotCreated(): void;
}

type Props = IComponentProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

export class RunningPodsView extends React.Component<Props, State> {
  public readonly state: State = initialState;

  public componentDidMount(): void {
    this.props.getRunningPodsOperation().catch(() => {
      this.props.toastr(`Failed to get running pod info.`, "error");
    });
  }

  public render() {
    const podInfo: IPodCardListData = this.props.pods
      .filter(p => p.name.includes(this.state.filteringValue))
      .map(p => ({
        id: (p.id || "").toString(),
        name: p.name,
        createdAt: p.createdAt,
        app: p.app || "Unknown",
        environment: p.env || "Unknown",
        isAlive: p.isAlive || false,
        isSaving: p.isSaving || false,
        snapshots: (p.snapshots || []).map(s => ({
          uuid: s.uuid,
          createdAt: s.createdAt,
          link: s.link
        })),
        onSaveButtonClick:
          p.app && p.env && p.name ? this.onSaveButtonClickWrap : undefined
      }));

    const podsOfApp = this.props.applicationName
      ? podInfo.filter(x => x.app === this.props.applicationName)
      : [];

    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Monitored Pods</div>
        <div className={styles.filter}>
          <PodFilter
            placeholder="Filter with..."
            onValueChange={this.onFilterChange}
          />
        </div>
        {this.props.applicationName && (
          <div className={styles.cardList}>
            <PodCardList
              data={podsOfApp}
              kind={"App: " + this.props.applicationName}
              noDataMessage={
                podInfo.length === 0
                  ? this.props.pods.length === 0
                    ? "No pods available"
                    : "No pods available with current filter"
                  : podsOfApp.length === 0
                  ? "No pods available for this app"
                  : ""
              }
            />
          </div>
        )}
        <div className={styles.cardList}>
          <PodCardList
            data={podInfo}
            kind="All"
            noDataMessage={
              this.props.pods.length === 0
                ? "No pods available"
                : "No pods available with current filter"
            }
          />
        </div>
      </div>
    );
  }

  private onFilterChange = (previous: string, current: string) => {
    this.setState({ filteringValue: current });
  };

  private onSaveButtonClickWrap = (app: string, env: string, pod: string) => {
    this.props
      .postSnapshotOperation({ appId: app, environment: env, podId: pod })
      .then(({ newSnapshot }) => {
        this.props.toastr(
          `New snapshot for "${newSnapshot.name} is created.`,
          "success"
        );
        this.props.snapshotCreated();
      })
      .catch(() => {
        this.props.toastr(
          `Failed to make a new snapshot for "${pod}.`,
          "error"
        );
      });
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RunningPodsView);
