import { push } from "connected-react-router";
import { Location } from "history";
import * as qs from "querystring";
import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  getAppsThunk,
  getEnvironmentsOfAppThunk,
  getLatestSnapshotsThunk,
  selectApp,
  selectEnv,
  selectPod,
  toastr
} from "../actions";
import AppSelector from "../components/AppSelector";
import SnapshotFilter from "../components/SnapshotFilter";
import SnapshotList, { IRowData } from "../components/SnapshotList";
import { OperationsToProps, thunkToActionBulk } from "../helpers";
import {
  IApplicationState,
  IEnvironmentInfo,
  IPodInfo,
  ISnapshotInfo
} from "../store";
import styles from "./SnapshotsView.scss";

interface IStateProps {
  appName: string | null;
  apps: string[];
  environments: { [appName: string]: IEnvironmentInfo };
  filteringEnvironment: string | null;
  filteringPod: string | null;
  pods: IPodInfo[];
  snapshots: ISnapshotInfo[];
  location: Location<any>;
}

const actions = {
  selectApp,
  selectEnv,
  selectPod,
  toastr,
  pushHistory: push
};

const operations = {
  getAppsThunk,
  getEnvironmentsOfAppThunk,
  getLatestSnapshotsThunk
};

type IDispatchProps = typeof actions & OperationsToProps<typeof operations>;

type IProps = IStateProps & IDispatchProps;

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

const mapStateToProps: (state: IApplicationState) => IStateProps = state => {
  return {
    appName: state.analysisData.applicationName,
    apps: sortedApplications(state.analysisData.applications),
    environments: state.analysisData.environments,
    filteringEnvironment: state.analysisData.selectedEnvironment,
    filteringPod: state.analysisData.selectedPod,
    pods: state.analysisData.pods,
    snapshots: sortedSnapshots(state.analysisData.snapshots),
    location: state.router.location
  };
};

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    { ...actions, ...thunkToActionBulk(operations) },
    dispatch
  );

export class SnapshotsView extends React.Component<IProps> {
  public componentDidMount() {
    this.props.getAppsThunk().catch(() => {
      this.props.toastr(`Failed to get app names.`, "error");
    });

    this.reloadView();
  }

  public reloadView() {
    const requested = qs.parse(location.search.substring(1));
    let requestedApp: string | null = null;
    let requestedEnv: string | null = null;
    if (
      "app" in requested &&
      typeof requested.app === "string" &&
      requested.app
    ) {
      requestedApp = requested.app;
      if (
        "env" in requested &&
        typeof requested.env === "string" &&
        requested.env
      ) {
        requestedEnv = requested.env;
      }
    }

    if (requestedApp) {
      this.prepareViewForApp(requestedApp);
      if (requestedEnv) {
        this.prepareViewForEnv(requestedEnv);
      }
    } else {
      this.props.getLatestSnapshotsThunk({ count: 10 }).catch(() => {
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
    let showingSnapshots: IRowData[] = [];

    if (this.props.snapshots.length > 0) {
      showingSnapshots = this.props.snapshots.map(x => ({
        uuid: x.uuid,
        name: x.name || "Unknown",
        environment: x.environment || "Unknown",
        pod: x.pod || "Unknown",
        createdAt: x.createdAt ? x.createdAt.toLocaleString() : "Unknown",
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
              unselectOptionLabel="Unselect"
              disabled={!this.props.appName}
            />
          </div>
          <div className={styles.podSelector}>
            <SnapshotFilter
              options={podFilterData}
              selectedValue={this.props.filteringPod}
              onValueChanged={this.onPodChanged.bind(this)}
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

  private onAppChanged(app: string) {
    const requested = qs.parse(this.props.location.search.substring(1));

    if (this.props.appName !== app) {
      const newQuery = { ...requested };
      if (app) {
        newQuery.app = app;
      } else {
        delete newQuery.app;
      }
      delete newQuery.env;

      this.props.pushHistory({
        search: `?${qs.stringify(newQuery)}`
      });
    }
    this.prepareViewForApp(app);
  }

  private prepareViewForApp(app: string) {
    this.props.selectApp({ appName: app });
    if (app) {
      this.props.getEnvironmentsOfAppThunk({ app }).catch(() => {
        this.props.toastr(`Failed to get environment info of ${app}`, "error");
      });
    }
    this.props.selectEnv({ envName: null }); // unselect
    this.props.selectPod({ podName: null }); // unselect
  }

  private onEnvironmentChanged(env: string) {
    const requested = qs.parse(this.props.location.search.substring(1));

    if (this.props.filteringEnvironment !== env) {
      const newQuery = { ...requested };
      if (env) {
        newQuery.env = env;
      } else {
        delete newQuery.env;
      }
      this.props.pushHistory({
        search: `?${qs.stringify(newQuery)}`
      });
    }
    this.prepareViewForEnv(env);
  }

  private prepareViewForEnv(env: string) {
    this.props.selectEnv({ envName: env });
    this.props.selectPod({ podName: null }); // unselect
  }

  private onPodChanged(pod: string) {
    this.props.selectPod({ podName: pod });
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { withRef: true }
)(SnapshotsView) as React.ComponentClass;
