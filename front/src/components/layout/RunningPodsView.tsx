import { Component, h } from "preact";
import { connect } from "preact-redux";
import { IApplicationState, IPodInfo } from "../../data-flow/store";
import PodCardList from "../PodCardList";
import PodFilter from "../PodFilter";
// @ts-ignore
import styles from "./RunningPodsView.scss";

const mapStateToProps = (state: IApplicationState) => ({
  applicationName: state.applicationName,
  pods: Object.values(state.environments).reduce(
    // flat-map
    (acc: IPodInfo[], x) => acc.concat(x.pods),
    []
  )
});

// @ts-ignore
@connect(mapStateToProps)
class RunningPodsView extends Component {
  public render() {
    // @ts-ignore
    const applicationName: string = this.props.applicationName;
    // @ts-ignore
    const pods: IPodInfo[] = this.props.pods;
    const podInfo = pods.map(p => ({
      id: (p.id || "").toString(),
      name: p.name,
      createdAt: p.createdAt ? p.createdAt.toDateString() : "Unknown",
      app: p.app || "Unknown",
      environment: p.env || "Unknown",
      snapshots: (p.snapshots || []).map(s => s.uuid)
    }));

    const podsOfApp = applicationName
      ? podInfo.filter(x => x.app === applicationName)
      : [];

    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Running Pods</div>
        <div>
          <PodFilter />
        </div>
        {applicationName && (
          <div>
            <PodCardList data={podsOfApp} kind={"App: " + applicationName} />
          </div>
        )}
        <div>
          <PodCardList data={podInfo} kind="All" />
        </div>
      </div>
    );
  }
}

export default RunningPodsView;
