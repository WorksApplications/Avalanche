import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as actions from "../actions/index";
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
      getEnvironmentsOfApp: actions.getEnvironmentsOfApp
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
        <div>
          <AppSelector
            options={showingData}
            value={applicationName}
            onValueChanged={this.onAppChanged.bind(this)}
            placeholder="Select landscape"
          />
        </div>
        <div className={styles.viewList}>
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
    this.props.selectApp(app);
    // @ts-ignore
    this.props.getEnvironmentsOfApp(app);
  }
}

export default NavigationView;
