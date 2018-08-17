import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as actions from "../actions";
import SnapshotFilter from "../components/SnapshotFilter";
import SnapshotList, { IRowData } from "../components/SnapshotList";
import { IApplicationState, IPodInfo, ISnapshotInfo } from "../store";
// @ts-ignore
import styles from "./SnapshotsView.scss";

const mapStateToProps = (state: IApplicationState) => {
  const pods: IPodInfo[] = Object.values(state.environments).reduce(
    // flat-map
    (acc: IPodInfo[], x) => acc.concat(x.pods),
    []
  );
  return {
    appName: state.applicationName,
    environments: state.environments,
    filteringEnvironment: state.selectedEnvironment,
    filteringPod: state.selectedPod,
    pods,
    snapshots: pods.reduce(
      // flat-map
      (acc: ISnapshotInfo[], x) => acc.concat(x.snapshots || []),
      []
    )
  };
};

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      selectEnv: actions.selectEnv,
      selectPod: actions.selectPod
    },
    dispatch
  );

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class SnapshotsView extends Component {
  constructor(props: {}) {
    super(props);
  }

  public render() {
    // @ts-ignore
    const appName = this.props.appName;
    const environmentNames: string[] = Object.keys(
      // @ts-ignore
      this.props.environments || {}
    );
    // @ts-ignore
    const podNames: string[] = this.props.pods.map(x => x.name);
    // @ts-ignore
    const snapshots: ISnapshotInfo[] = this.props.snapshots;
    // @ts-ignore
    const filteringEnvironment = this.props.filteringEnvironment;
    // @ts-ignore
    const filteringPod = this.props.filteringPod;

    const envFilterData = environmentNames.map(x => ({ label: x, value: x }));
    const podFilterData = podNames.map(x => ({ label: x, value: x }));

    let emptyMessage =
      snapshots.length > 0 ? "Please select environment" : "No Data";
    let showingData: IRowData[] = [];

    if (snapshots.length > 0 && filteringEnvironment) {
      showingData = snapshots.map(x => ({
        uuid: x.uuid,
        name: x.name || "Unknown",
        environment: x.environment || "Unknown",
        pod: x.pod || "Unknown",
        createdAt: x.createdAt ? x.createdAt.toDateString() : "Unknown",
        labels: [], // TODO
        link: x.link || "#",
        isReady: false // TODO
      }));
      showingData = showingData.filter(
        x => x.environment === filteringEnvironment
      );
      if (filteringPod) {
        showingData = showingData.filter(x => x.pod === filteringPod);
      }
      if (showingData.length === 0) {
        emptyMessage = "No Data";
      }
    }

    // TODO fix cell width value

    return (
      <div
        className={[
          styles.wrap,
          !appName ? styles.waitForAppSelect : undefined
        ].join(" ")}
      >
        <div className={styles.environmentSelector}>
          <SnapshotFilter
            options={envFilterData}
            selectedValue={filteringEnvironment}
            onValueChanged={this.onEnvironmentChanged.bind(this)}
            placeholder="Select environment"
            disabled={!appName}
          />
        </div>
        <div className={styles.podSelector}>
          <SnapshotFilter
            options={podFilterData}
            selectedValue={filteringPod}
            onValueChanged={this.onPodChanged.bind(this)}
            placeholder="Select pod name"
            unselectOptionLabel="Unselect"
            disabled={!filteringEnvironment}
          />
        </div>
        <div className={styles.snapshotList}>
          <SnapshotList rows={showingData} emptyMessage={emptyMessage} />
        </div>
      </div>
    );
  }

  private onEnvironmentChanged(env: string) {
    // @ts-ignore
    const selectEnv: typeof actions.selectEnv = this.props.selectEnv;
    selectEnv({ envName: env });
    // @ts-ignore
    const selectPod: typeof actions.selectPod = this.props.selectPod;
    selectPod({ podName: null }); // unselect
  }

  private onPodChanged(pod: string) {
    // @ts-ignore
    const selectPod: typeof actions.selectPod = this.props.selectPod;
    selectPod({ podName: pod });
  }
}

export default SnapshotsView;
