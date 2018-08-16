import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as actions from "../actions";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./TitleBar";
import Workspace from "./Workspace";

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      getApps: actions.getApps,
      getRunningPods: actions.getRunningPods
    },
    dispatch
  );

// @ts-ignore
@connect(
  undefined,
  mapDispatchToProps
)
class App extends Component {
  public componentWillMount(): void {
    // @ts-ignore
    const getApps: typeof actions.getApps = this.props.getApps;
    getApps();

    // @ts-ignore
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
      </div>
    );
  }
}

export default App;
