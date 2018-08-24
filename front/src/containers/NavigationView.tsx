import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
// tslint:disable-next-line:no-submodule-imports
import { Link } from "preact-router/match";
import * as qs from "querystring";
import { bindActionCreators, Dispatch } from "redux";
import {
  getEnvironmentsOfApp,
  selectApp,
  selectEnv,
  selectPod
} from "../actions";
import AppSelector from "../components/AppSelector";
import { APP_NAME } from "../constants";
import { IApplicationState } from "../store";
// @ts-ignore
import styles from "./NavigationView.scss";

interface IStateProps {
  applicationName: string | null;
  applications: string[];
}

interface IDispatchProps {
  selectApp: typeof selectApp;
  getEnvironmentsOfApp: typeof getEnvironmentsOfApp;
  selectEnv: typeof selectEnv;
  selectPod: typeof selectPod;
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  applicationName: state.analysisData.applicationName,
  applications: state.analysisData.applications
});

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
class NavigationView extends Component<IStateProps & IDispatchProps> {
  public componentWillMount() {
    // get app & env from query in url
    const requested = qs.parse(window.location.search.substring(1));
    if (
      "app" in requested &&
      typeof requested.app === "string" &&
      requested.app
    ) {
      this.changeApp(requested.app, true);
    }
  }

  public render() {
    const showingData = this.props.applications.map(x => ({
      label: x,
      value: x
    }));
    return (
      <div className={styles.wrap}>
        <div className={styles.appContext}>
          <div className={styles.label}>Application Context</div>
          <div className={styles.selector}>
            <AppSelector
              options={showingData}
              selectedValue={this.props.applicationName}
              onValueChanged={this.onAppChanged.bind(this)}
              placeholder="Select landscape"
            />
          </div>
        </div>
        <div className={[styles.viewList, styles.waitForAppSelect].join(" ")}>
          <Link
            activeClassName={styles.selected}
            className={styles.viewItem}
            href="/"
          >
            Snapshots
          </Link>
        </div>
        {/* This will be config & login */}
      </div>
    );
  }

  private onAppChanged(app: string) {
    this.changeApp(app);
  }

  private changeApp(app: string, isInizalizing = false) {
    this.props.selectApp({ appName: app });
    this.props.getEnvironmentsOfApp(app);
    this.props.selectEnv({ envName: null }); // unselect
    this.props.selectPod({ podName: null }); // unselect

    // set app to query in url
    const requested = qs.parse(window.location.search.substring(1));
    const newQuery = { ...requested };
    newQuery.app = app;
    if (!isInizalizing && "env" in newQuery) {
      delete newQuery.env;
    }
    // current browser does not support 2nd argument :yaomin:
    history.pushState({}, `${APP_NAME} | ${app}`, "?" + qs.stringify(newQuery));
  }
}

export default (NavigationView as any) as FunctionalComponent;
