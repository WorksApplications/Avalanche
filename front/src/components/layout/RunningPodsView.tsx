import { Component, h } from "preact";
import PodCardList from "../PodCardList";
import PodFilter from "../PodFilter";
// @ts-ignore
import styles from "./RunningPodsView.scss";

class RunningPodsView extends Component {
  public render() {
    const ssRawTmpData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "special_luther-special_luther",
        createdAt: new Date(),
        app: "ac-expense",
        environment: "jillj",
        snapshots: []
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "excellent_luis-excellent_luis",
        createdAt: new Date(),
        app: "hr-talentsearch",
        environment: "jillk",
        snapshots: []
      }
    ];

    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Running Pods</div>
        <div>
          <PodFilter />
        </div>
        <div>
          <PodCardList data={ssRawTmpData} kind="App" />
        </div>
        <div>
          <PodCardList data={ssRawTmpData} kind="All" />
        </div>
      </div>
    );
  }
}

export default RunningPodsView;
