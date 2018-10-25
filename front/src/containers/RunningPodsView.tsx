import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getRunningPodsThunk, postSnapshotThunk, toastr } from "../actions";
import PodCardList, { IPodCardListData } from "../components/PodCardList";
import PodFilter from "../components/PodFilter";
import { OperationToProps, thunkToActionBulk } from "../helpers";
import { IApplicationState, IPodInfo } from "../store";
// @ts-ignore
import styles from "./RunningPodsView.scss";

interface IState {
  filteringValue: string;
}

interface IStateProps {
  applicationName: string | null;
  pods: IPodInfo[];
}

const actions = {
  toastr
};

const operations = {
  postSnapshotThunk,
  getRunningPodsThunk
};

type IDispatchProps = typeof actions & OperationToProps<typeof operations>;

type IProps = IStateProps & IDispatchProps;

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
    return a.name > b.name ? 1 : -1;
  });
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  applicationName: state.analysisData.applicationName,
  pods: sortedPods(state.analysisData.runningPods)
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    { ...actions, ...thunkToActionBulk(operations) },
    dispatch
  );

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class RunningPodsView extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      filteringValue: ""
    };
  }

  public componentDidMount(): void {
    this.props.getRunningPodsThunk().catch(() => {
      this.props.toastr(`Failed to get running pod info.`, "error");
    });
  }

  public render() {
    const podInfo: IPodCardListData = this.props.pods
      .filter(p => p.name.startsWith(this.state.filteringValue))
      .map(p => ({
        id: (p.id || "").toString(),
        name: p.name,
        createdAt: p.createdAt,
        app: p.app || "Unknown",
        environment: p.env || "Unknown",
        isAlive: p.isAlive || false,
        isSaving: p.isSaving || false,
        snapshots: (p.snapshots || []).map(s => ({
          uuid: s.uuid,
          createdAt: s.createdAt,
          link: s.link
        })),
        onSaveButtonClick:
          p.app && p.env && p.name
            ? () => {
                this.props
                  .postSnapshotThunk({
                    appId: p.app!,
                    environment: p.env!,
                    podId: p.name!
                  })
                  .then(({ newSnapshot }) => {
                    this.props.toastr(
                      `New snapshot for "${newSnapshot.name} is created.`,
                      "success"
                    );
                  })
                  .catch(() => {
                    this.props.toastr(
                      `Failed to make a new snapshot for "${p.name!}.`,
                      "error"
                    );
                  });
              }
            : undefined
      }));

    const podsOfApp = this.props.applicationName
      ? podInfo.filter(x => x.app === this.props.applicationName)
      : [];

    return (
      <div className={styles.wrap}>
        <div className={styles.title}>Monitored Pods</div>
        <div className={styles.filter}>
          <PodFilter
            placeholder="Filter with..."
            onValueChange={this.onFilterChange.bind(this)}
          />
        </div>
        {this.props.applicationName && (
          <div className={styles.cardList}>
            <PodCardList
              data={podsOfApp}
              kind={"App: " + this.props.applicationName}
              noDataMessage={
                podInfo.length === 0
                  ? this.props.pods.length === 0
                    ? "No pods available"
                    : "No pods available with current filter"
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
            noDataMessage={
              this.props.pods.length === 0
                ? "No pods available"
                : "No pods available with current filter"
            }
          />
        </div>
      </div>
    );
  }

  // noinspection JSUnusedLocalSymbols
  private onFilterChange(previous: string, current: string) {
    this.setState({ filteringValue: current });
  }
}

export default (RunningPodsView as any) as React.ComponentClass;
