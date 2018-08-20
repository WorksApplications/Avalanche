import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { postSnapshot } from "../actions";
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
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  applicationName: state.applicationName,
  pods: state.runningPods
});

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators({ postSnapshot }, dispatch);

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class RunningPodsView extends Component<IStateProps & IDispatchProps> {
  public render() {
    const podInfo = this.props.pods.map(p => ({
      id: (p.id || "").toString(),
      name: p.name,
      createdAt: p.createdAt ? p.createdAt.toDateString() : "Unknown",
      app: p.app || "Unknown",
      environment: p.env || "Unknown",
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
        <div className={styles.title}>Running Pods</div>
        <div>
          <PodFilter />
        </div>
        {this.props.applicationName && (
          <div className={styles.cardList}>
            <PodCardList
              data={podsOfApp}
              kind={"App: " + this.props.applicationName}
            />
          </div>
        )}
        <div className={styles.cardList}>
          <PodCardList data={podInfo} kind="All" />
        </div>
      </div>
    );
  }
}

export default (RunningPodsView as any) as FunctionalComponent;
