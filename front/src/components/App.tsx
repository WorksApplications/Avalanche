import { Component, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getApps } from "../data-flow/actions";
// @ts-ignore
import styles from "./App.scss";
import TitleBar from "./layout/TitleBar";
import Workspace from "./layout/Workspace";

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      getApps
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
