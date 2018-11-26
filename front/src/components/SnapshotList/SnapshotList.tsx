// tslint:disable:max-classes-per-file
import * as React from "react";
import { HeatLineChartProperty } from "../HeatLineChart";
import Link from "../Link";
import Spinner from "../Spinner";
import styles from "./SnapshotList.scss";

const HeatLineChart = React.lazy(() =>
  import(/* webpackChunkName: "heat-line-chart" */ "../HeatLineChart")
);

type HeatMapData = HeatLineChartProperty & {
  numColumns: number;
  numRows: number;
};

export interface IItemProperty {
  uuid: string;
  environment: string;
  podName: string;
  createdAt?: Date;
  link: string;
  heatMap?: HeatMapData;
  heatMapId: string;
  heatMapStatus: "empty" | "loading" | "loaded" | "failed";
  openByDefault?: boolean;

  getHeatMap(snapshotId: string, heatMapId: string): void;
  onRangeSelect(heatMapId: string, start: number, end: number): void;
}

const initialItemState = {
  isGraphOpen: null as boolean | null
};

type ItemState = Readonly<typeof initialItemState>;

const spinner = (
  <div className={styles.spinner}>
    <Spinner />
  </div>
);

// This child component is tightly coupled as a table row element
export class SnapshotItem extends React.Component<IItemProperty, ItemState> {
  public static getDerivedStateFromProps(
    props: IItemProperty,
    state: ItemState
  ): ItemState {
    // open the page by default if `openByDefault` is set
    const isGraphOpen =
      state.isGraphOpen !== null
        ? state.isGraphOpen
        : typeof props.openByDefault !== "undefined"
        ? props.openByDefault
        : state.isGraphOpen;
    return { ...state, isGraphOpen };
  }

  public readonly state: ItemState = initialItemState;

  public componentDidMount() {
    if (this.state.isGraphOpen && this.props.heatMapStatus === "empty") {
      this.props.getHeatMap(this.props.uuid, this.props.heatMapId);
    }
  }

  public render() {
    return (
      <tbody onClick={this.onRowClick} data-testid="snapshot">
        <tr>
          <td>{this.props.uuid}</td>
          <td>{this.props.podName}</td>
          <td>{this.props.environment}</td>
          <td data-testid="snapshot-date">
            {(this.props.createdAt && this.props.createdAt.toLocaleString()) ||
              "Unknown"}
          </td>
          <td>
            <Link href={this.props.link}>Framescope</Link>
          </td>
          <td className={styles.expander}>
            <i className={"material-icons"}>
              {this.state.isGraphOpen ? "expand_less" : "expand_more"}
            </i>
          </td>
        </tr>
        {this.state.isGraphOpen && (
          <tr>
            <td colSpan={6} className={styles.graphArea}>
              {this.renderBody()}
            </td>
          </tr>
        )}
      </tbody>
    );
  }

  private renderBody() {
    switch (this.props.heatMapStatus) {
      case "empty":
        return <div />;
      case "loading":
        return spinner;
      case "loaded":
        if (this.props.heatMap) {
          return (
            <React.Suspense fallback={spinner}>
              <div className={styles.heatMap}>
                <HeatLineChart
                  {...this.props.heatMap}
                  hash={this.props.uuid}
                  onRangeSelect={this.onRangeSelectWrap}
                />
              </div>
            </React.Suspense>
          );
        }
      // fallthrough if heatMap === null && status === "loaded"
      // noinspection FallThroughInSwitchStatementJS
      case "failed":
        return (
          <div className={styles.errorMessage}>
            <span>Failed to load</span>
          </div>
        );
    }
  }

  private onRowClick = () => {
    const willGraphOpen = !this.state.isGraphOpen;
    if (
      this.props.heatMapStatus === "empty" &&
      !this.props.heatMap &&
      willGraphOpen
    ) {
      this.props.getHeatMap(this.props.uuid, this.props.heatMapId);
    }
    this.setState({ isGraphOpen: willGraphOpen });
  };

  private onRangeSelectWrap = (start: number, end: number) => {
    this.props.onRangeSelect(this.props.heatMapId, start, end);
  };
}

export function Empty(props: { emptyMessage?: string }) {
  return (
    <tbody>
      <tr className={styles.empty} data-testid="empty-message">
        <td colSpan={6}>{props.emptyMessage}</td>
      </tr>
    </tbody>
  );
}

export interface IProperty {
  rows: IItemProperty[];
  emptyMessage?: string;
}

export class SnapshotList extends React.Component<IProperty> {
  public render() {
    return (
      <div className={styles.wrap} data-testid="root">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UUID</th>
              <th>Pod Name</th>
              <th>Environment</th>
              <th>Created at</th>
              <th>Link</th>
              <th />
            </tr>
          </thead>
          {this.props.rows.map((r, i) => (
            <SnapshotItem
              key={r.uuid}
              {...r}
              openByDefault={i === 0 ? true : undefined}
            />
          ))}
          {this.props.rows.length === 0 && (
            <Empty emptyMessage={this.props.emptyMessage} />
          )}
        </table>
      </div>
    );
  }
}

export default SnapshotList;
