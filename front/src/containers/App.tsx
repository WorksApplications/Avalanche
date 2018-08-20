import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getApps, getRunningPods, selectApp } from "../actions";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./TitleBar";
import Toastr from "./Toastr";
import Workspace from "./Workspace";

interface IDispatchProps {
  getApps: typeof getApps;
  selectApp: typeof selectApp;
  getRunningPods: typeof getRunningPods;
}

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators({ getApps, selectApp, getRunningPods }, dispatch);

// @ts-ignore
@connect(
  undefined,
  mapDispatchToProps
)
class App extends Component<IDispatchProps> {
  public componentWillMount(): void {
    this.props.getApps();
    this.props.getRunningPods();
  }

  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.title}>
          <TitleBar />
        </div>
        <div className={styles.content}>
          <Workspace />
        </div>
        <div className={styles.toastr}>
          <Toastr />
        </div>
      </div>
    );
  }
}

export default (App as any) as FunctionalComponent;
