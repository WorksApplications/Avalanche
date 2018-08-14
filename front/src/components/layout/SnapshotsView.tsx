import { Component, h } from "preact";
import { connect } from "preact-redux";
import {
  IApplicationState,
  IPodInfo,
  ISnapshotInfo
} from "../../data-flow/store";
import SnapshotFilter from "../SnapshotFilter";
import SnapshotList, { IRowData } from "../SnapshotList";
// @ts-ignore
import styles from "./SnapshotsView.scss";

interface IState {
  filteringEnvironment?: string;
  filteringPod?: string;
}

const mapStateToProps = (state: IApplicationState) => {
  const pods: IPodInfo[] = Object.values(state.environments).reduce(
    // flat-map
    (acc: IPodInfo[], x) => acc.concat(x.pods),
    []
  );
  return {
    environments: state.environments,
    pods,
    snapshots: pods.reduce(
      // flat-map
      (acc: ISnapshotInfo[], x) => acc.concat(x.snapshots || []),
      []
    )
  };
};

// @ts-ignore
@connect(mapStateToProps)
class SnapshotsView extends Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public render() {
    const environmentNames: string[] = Object.keys(
      // @ts-ignore
      this.props.environments || {}
    );
    // @ts-ignore
    const podNames: string[] = this.props.pods.map(x => x.name);
    // @ts-ignore
    const snapshots: ISnapshotInfo[] = this.props.snapshots;

    const envFilterData = environmentNames.map(x => ({ label: x, value: x }));
    const podFilterData = podNames.map(x => ({ label: x, value: x }));

    let emptyMessage =
      snapshots.length > 0 ? "Please select environment" : "No Data";
    let showingData: IRowData[] = [];

    // TODO when app is re-selected, how filtering should be?
    if (snapshots.length > 0 && this.state.filteringEnvironment) {
      showingData = snapshots.map(x => ({
        uuid: x.uuid,
        name: "HOGE", // TODO
        environment: "systema", // TODO
        pod: "????", // TODO
        createdAt: x.createdAt ? x.createdAt.toDateString() : "Unknown",
        labels: [], // TODO
        link: "#", // TODO
        isReady: false // TODO
      }));
      showingData = showingData.filter(
        x => x.environment === this.state.filteringEnvironment
      );
      if (this.state.filteringPod) {
        showingData = showingData.filter(
          x => x.pod === this.state.filteringPod
        );
      }
      if (showingData.length === 0) {
        emptyMessage = "No Data";
      }
    }

    // TODO no filter option in drop-down list?
    // TODO fix cell width value

    return (
      <div className={styles.wrap}>
        <div className={styles.environmentSelector}>
          <SnapshotFilter
            options={envFilterData}
            onValueChanged={this.onEnvironmentChanged.bind(this)}
            placeholder="Select environment"
          />
        </div>
        <div className={styles.podSelector}>
          <SnapshotFilter
            options={podFilterData}
            onValueChanged={this.onPodChanged.bind(this)}
            placeholder="Select pod name"
          />
        </div>
        <div className={styles.snapshotList}>
          <SnapshotList rows={showingData} emptyMessage={emptyMessage} />
        </div>
      </div>
    );
  }

  private onEnvironmentChanged(env: string) {
    this.setState({ filteringEnvironment: env });
  }

  private onPodChanged(pod: string) {
    this.setState({ filteringPod: pod });
  }
}

export default SnapshotsView;
