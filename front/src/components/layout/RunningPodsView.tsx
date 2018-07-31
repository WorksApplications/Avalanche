import { Component, h } from "preact";
// @ts-ignore
import styles from "./RunningPodsView.scss";

class RunningPodsView extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Running Pods</div>
      </div>
    );
  }
}

export default RunningPodsView;
