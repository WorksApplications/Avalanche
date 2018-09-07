import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import * as qs from "querystring";
import { bindActionCreators, Dispatch } from "redux";
import { selectEnv, selectPod } from "../actions";
import SnapshotFilter from "../components/SnapshotFilter";
import SnapshotList, { IRowData } from "../components/SnapshotList";
import { APP_NAME } from "../constants";
import {
  IApplicationState,
  IEnvironmentInfo,
  IPodInfo,
  ISnapshotInfo
} from "../store";
// @ts-ignore
import styles from "./SnapshotsView.scss";

interface IStateProps {
  appName: string | null;
  environments: { [appName: string]: IEnvironmentInfo };
  filteringEnvironment: string | null;
  filteringPod: string | null;
  pods: IPodInfo[];
  snapshots: ISnapshotInfo[];
}

interface IDispatchProps {
  selectEnv: typeof selectEnv;
  selectPod: typeof selectPod;
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => {
  const pods: IPodInfo[] = Object.values(
    state.analysisData.environments
  ).reduce(
    // flat-map
    (acc: IPodInfo[], x) => acc.concat(x.pods),
    []
  );
  return {
    appName: state.analysisData.applicationName,
    environments: state.analysisData.environments,
    filteringEnvironment: state.analysisData.selectedEnvironment,
    filteringPod: state.analysisData.selectedPod,
    pods,
    snapshots: pods.reduce(
      // flat-map
      (acc: ISnapshotInfo[], x) => acc.concat(x.snapshots || []),
      []
    )
  };
};

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators({ selectEnv, selectPod }, dispatch);

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class SnapshotsView extends Component<IStateProps & IDispatchProps> {
  public componentWillMount() {
    // get app & env from query in url
    const requested = qs.parse(window.location.search.substring(1));
    if (
      "app" in requested &&
      typeof requested.app === "string" &&
      requested.app &&
      "env" in requested &&
      typeof requested.env === "string" &&
      requested.env
    ) {
      this.changeEnvironment(requested.env);
    }
  }

  public render() {
    const environmentNames: string[] = Object.keys(
      this.props.environments || {}
    );
    const podNames: string[] = this.props.pods.map(x => x.name);

    const envFilterData = environmentNames.map(x => ({ label: x, value: x }));
    const podFilterData = podNames.map(x => ({ label: x, value: x }));

    let emptyMessage =
      this.props.snapshots.length > 0 ? "Please select environment" : "No Data";
    let showingData: IRowData[] = [];

    if (this.props.snapshots.length > 0) {
      showingData = this.props.snapshots.map(x => ({
        uuid: x.uuid,
        name: x.name || "Unknown",
        environment: x.environment || "Unknown",
        pod: x.pod || "Unknown",
        createdAt: x.createdAt ? x.createdAt.toDateString() : "Unknown",
        labels: [], // TODO
        link: x.link || "#",
        isReady: false // TODO
      }));
      if (this.props.filteringEnvironment) {
          showingData = showingData.filter(
            x => x.environment === this.props.filteringEnvironment
          );
      }
      if (this.props.filteringPod) {
        showingData = showingData.filter(
          x => x.pod === this.props.filteringPod
        );
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
          !this.props.appName ? styles.waitForAppSelect : undefined
        ].join(" ")}
      >
        <div className={styles.environmentSelector}>
          <SnapshotFilter
            options={envFilterData}
            selectedValue={this.props.filteringEnvironment}
            onValueChanged={this.onEnvironmentChanged.bind(this)}
            placeholder="Select environment"
            disabled={!this.props.appName}
          />
        </div>
        <div className={styles.podSelector}>
          <SnapshotFilter
            options={podFilterData}
            selectedValue={this.props.filteringPod}
            onValueChanged={this.onPodChanged.bind(this)}
            placeholder="Select pod name"
            unselectOptionLabel="Deselect"
            disabled={!this.props.filteringEnvironment}
          />
        </div>
        <div className={styles.snapshotList}>
          <SnapshotList rows={showingData} emptyMessage={emptyMessage} />
        </div>
      </div>
    );
  }

  private onEnvironmentChanged(env: string) {
    this.changeEnvironment(env);
  }

  private changeEnvironment(env: string) {
    this.props.selectEnv({ envName: env });
    this.props.selectPod({ podName: null }); // unselect

    // set app to query in url
    const requested = qs.parse(window.location.search.substring(1));
    const newQuery = { ...requested };
    newQuery.app = this.props.appName || undefined;
    newQuery.env = env;
    // current browser does not support 2nd argument :yaomin:
    history.pushState(
      {},
      `${APP_NAME} | ${this.props.appName}-${env}`,
      "?" + qs.stringify(newQuery)
    );
  }

  private onPodChanged(pod: string) {
    this.props.selectPod({ podName: pod });
  }
}

export default (SnapshotsView as any) as FunctionalComponent;
