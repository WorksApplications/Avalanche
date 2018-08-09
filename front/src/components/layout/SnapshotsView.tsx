import { Component, h } from "preact";
import SnapshotFilter from "../SnapshotFilter";
import SnapshotList from "../SnapshotList";
// @ts-ignore
import styles from "./SnapshotsView.scss";

interface IState {
  filteringEnvironment?: string;
  filteringPod?: string;
}

class SnapshotsView extends Component<{}, IState> {
  // TODO change this
  private ssRawTmpData = [
    {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      name: "alice-excellent_luis",
      environment: "jillj",
      pod: "special_luther-special_luther",
      createdAt: new Date(),
      labels: [],
      link: "http://example.com/",
      isReady: true
    },
    {
      uuid: "550e8400-e29b-41d4-a716-446655440001",
      name: "bob-excellent_luis",
      environment: "jillk",
      pod: "excellent_luis-excellent_luis",
      createdAt: new Date(),
      labels: [],
      link: "http://example.com/",
      isReady: true
    }
  ];

  constructor(props: {}) {
    super(props);
    // TODO connect, store
    this.state = {};
  }

  public render() {
    // TODO change this to logical process
    const envTmpData = this.ssRawTmpData.map(x => {
      return { label: x.environment, value: x.environment };
    });
    const podTmpData = this.ssRawTmpData.map(x => {
      return { label: x.pod, value: x.pod };
    });

    let showingData = this.ssRawTmpData;
    if (this.state.filteringEnvironment) {
      showingData = showingData.filter(
        x => x.environment === this.state.filteringEnvironment
      );
    }
    if (this.state.filteringPod) {
      showingData = showingData.filter(x => x.pod === this.state.filteringPod);
    }

    // TODO no filter option in drop-down list?
    // TODO fix cell width value

    return (
      <div className={styles.wrap}>
        <div className={styles.environmentSelector}>
          <SnapshotFilter
            options={envTmpData}
            onValueChanged={this.onEnvironmentChanged.bind(this)}
            placeholder="Select environment"
          />
        </div>
        <div className={styles.podSelector}>
          <SnapshotFilter
            options={podTmpData}
            onValueChanged={this.onPodChanged.bind(this)}
            placeholder="Select pod name"
          />
        </div>
        <div className={styles.snapshotList}>
          <SnapshotList rows={showingData} />
        </div>
      </div>
    );
  }

  private onEnvironmentChanged(env: string) {
    this.setState({ filteringEnvironment: env });
  }

  private onPodChanged(pod: string) {
    this.setState({ filteringPod: pod });
  }
}

export default SnapshotsView;
