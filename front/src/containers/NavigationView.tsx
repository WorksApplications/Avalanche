import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as actions from "../actions";
import AppSelector from "../components/AppSelector";
import { IApplicationState } from "../store";
// @ts-ignore
import styles from "./NavigationView.scss";

const mapStateToProps = (state: IApplicationState) => ({
  applicationName: state.applicationName,
  applications: state.applications
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      selectApp: actions.selectApp,
      getEnvironmentsOfApp: actions.getEnvironmentsOfApp,
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
class NavigationView extends Component {
  public render() {
    // @ts-ignore
    const applications: string[] = this.props.applications;
    // @ts-ignore
    const applicationName: string = this.props.applicationName;
    const showingData = applications.map(x => ({ label: x, value: x }));
    return (
      <div className={styles.wrap}>
        <div className={styles.appContext}>
          <div className={styles.label}>Application Context</div>
          <div className={styles.selector}>
            <AppSelector
              options={showingData}
              selectedValue={applicationName}
              onValueChanged={this.onAppChanged.bind(this)}
              placeholder="Select landscape"
            />
          </div>
        </div>
        <div className={[styles.viewList, styles.waitForAppSelect].join(" ")}>
          <div className={[styles.viewItem, styles.selected].join(" ")}>
            Snapshots
          </div>
        </div>
        {/* This will be config & login */}
      </div>
    );
  }

  private onAppChanged(app: string) {
    // @ts-ignore
    const selectApp: typeof actions.selectApp = this.props.selectApp;
    selectApp({ appName: app });
    const getEnvironmentsOfApp: typeof actions.getEnvironmentsOfApp =
      // @ts-ignore
      this.props.getEnvironmentsOfApp;
    getEnvironmentsOfApp(app);
    // @ts-ignore
    const selectEnv: typeof actions.selectEnv = this.props.selectEnv;
    selectEnv({ envName: null }); // unselect
    // @ts-ignore
    const selectPod: typeof actions.selectPod = this.props.selectPod;
    selectPod({ podName: null }); // unselect
  }
}

export default NavigationView;
