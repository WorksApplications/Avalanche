import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import * as qs from "querystring";
import { bindActionCreators, Dispatch } from "redux";
import {
  getEnvironmentsOfApp,
  selectApp,
  selectEnv,
  selectPod
} from "../actions";
import AppSelector from "../components/AppSelector";
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
  apps: string[];
  environments: { [appName: string]: IEnvironmentInfo };
  filteringEnvironment: string | null;
  filteringPod: string | null;
  pods: IPodInfo[];
  snapshots: ISnapshotInfo[];
}

interface IDispatchProps {
  selectApp: typeof selectApp;
  getEnvironmentsOfApp: typeof getEnvironmentsOfApp;
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
    apps: state.analysisData.applications,
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
  bindActionCreators(
    { selectApp, getEnvironmentsOfApp, selectEnv, selectPod },
    dispatch
  );

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
      requested.app
    ) {
      this.changeApp(requested.app, true);

      if (
        "env" in requested &&
        typeof requested.env === "string" &&
        requested.env
      ) {
        this.changeEnvironment(requested.env);
      }
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
    let showingSnapshots: IRowData[] = [];

    if (this.props.snapshots.length > 0) {
      showingSnapshots = this.props.snapshots.map(x => ({
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
        showingSnapshots = showingSnapshots.filter(
          x => x.environment === this.props.filteringEnvironment
        );
      }
      if (this.props.filteringPod) {
        showingSnapshots = showingSnapshots.filter(
          x => x.pod === this.props.filteringPod
        );
      }
      if (showingSnapshots.length === 0) {
        emptyMessage = "No Data";
      }
    }

    // TODO fix cell width value

    return (
      <div className={styles.wrap}>
        <div className={styles.appContext}>
          <div className={styles.label}>Application Context</div>
          <div className={styles.selector}>
            <AppSelector
              options={showingApps}
              selectedValue={this.props.appName}
              onValueChanged={this.onAppChanged.bind(this)}
              placeholder="Select Application"
            />
          </div>
        </div>
        <div className={styles.innerWrap}>
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
            <SnapshotList rows={showingSnapshots} emptyMessage={emptyMessage} />
          </div>
        </div>
      </div>
    );
  }

  private onAppChanged(app: string) {
    this.changeApp(app);
  }

  private changeApp(app: string, isInitializing = false) {
    this.props.selectApp({ appName: app });
    this.props.getEnvironmentsOfApp(app);
    this.props.selectEnv({ envName: null }); // unselect
    this.props.selectPod({ podName: null }); // unselect

    // set app to query in url
    const requested = qs.parse(window.location.search.substring(1));
    const newQuery = { ...requested };
    newQuery.app = app;
    if (!isInitializing && "env" in newQuery) {
      delete newQuery.env;
    }
    // current browser does not support 2nd argument :yaomin:
    history.pushState({}, `${APP_NAME} | ${app}`, "?" + qs.stringify(newQuery));
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
