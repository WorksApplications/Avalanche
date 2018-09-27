import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getRunningPods, postSnapshot } from "../actions";
import PodCardList from "../components/PodCardList";
import PodFilter from "../components/PodFilter";
import { IApplicationState, IPodInfo } from "../store";
// @ts-ignore
import styles from "./RunningPodsView.scss";

interface IStateProps {
  applicationName: string | null;
  pods: IPodInfo[];
}

interface IDispatchProps {
  postSnapshot: typeof postSnapshot;
  getRunningPods: typeof getRunningPods;
}

function sortedPods(pods: IPodInfo[]): IPodInfo[] {
  return pods.sort((a, b) => {
    if (!a) {
      return 1;
    }
    if (!b) {
      return -1;
    }

    // living pod first
    if (a.isAlive && !b.isAlive) {
      return -1;
    }
    if (!a.isAlive && b.isAlive) {
      return 1;
    }

    if (!a.createdAt) {
      return 1;
    }
    if (!b.createdAt) {
      return -1;
    }

    // newer pod first
    const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    // dictionary order
    return a > b ? 1 : -1;
  });
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  applicationName: state.analysisData.applicationName,
  pods: sortedPods(state.analysisData.runningPods)
});

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators({ postSnapshot, getRunningPods }, dispatch);

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class RunningPodsView extends Component<IStateProps & IDispatchProps> {
  public componentDidMount(): void {
    this.props.getRunningPods();
  }

  public render() {
    const podInfo = this.props.pods.map(p => ({
      id: (p.id || "").toString(),
      name: p.name,
      createdAt: p.createdAt ? p.createdAt.toDateString() : "Unknown",
      app: p.app || "Unknown",
      environment: p.env || "Unknown",
      isAlive: p.isAlive || false,
      snapshots: (p.snapshots || []).map(s => s.uuid),
      onSaveButtonClick:
        p.app && p.env && p.name
          ? () => this.props.postSnapshot(p.app!, p.env!, p.name!)
          : undefined
    }));

    const podsOfApp = this.props.applicationName
      ? podInfo.filter(x => x.app === this.props.applicationName)
      : [];

    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Monitored Pods</div>
        <div>
          <PodFilter />
        </div>
        {this.props.applicationName && (
          <div className={styles.cardList}>
            <PodCardList
              data={podsOfApp}
              kind={"App: " + this.props.applicationName}
              noDataMessage={
                podInfo.length === 0
                  ? "No pods available"
                  : podsOfApp.length === 0
                    ? "No pods available for this app"
                    : ""
              }
            />
          </div>
        )}
        <div className={styles.cardList}>
          <PodCardList
            data={podInfo}
            kind="All"
            noDataMessage="No pods available."
          />
        </div>
      </div>
    );
  }
}

export default (RunningPodsView as any) as FunctionalComponent;
