import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getApps, getRunningPods } from "../actions";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./TitleBar";
import Workspace from "./Workspace";

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      getApps,
      getRunningPods
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
    this.props.getApps();
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
