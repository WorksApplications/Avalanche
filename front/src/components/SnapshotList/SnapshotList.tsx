// tslint:disable:max-classes-per-file
import * as React from "react";
import HeatLineChart, { HeatMapData } from "../HeatLineChart";
import Link from "../Link";
import Spinner from "../Spinner";
import styles from "./SnapshotList.scss";

export interface IItemProperty {
  uuid: string;
  environment: string;
  podName: string;
  createdAt?: Date;
  link: string;
  heatMap?: HeatMapData;
  heatMapStatus: "empty" | "loading" | "loaded" | "failed";
  openByDefault?: boolean;

  getHeatMap(): void;
}

const initialItemState = {
  isGraphOpen: null as boolean | null
};

type ItemState = Readonly<typeof initialItemState>;

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
      this.props.getHeatMap();
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
        </tr>
        {this.state.isGraphOpen && (
          <tr>
            <td colSpan={5} className={styles.graphArea}>
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
        return (
          <div className={styles.spinner}>
            <Spinner />
          </div>
        );
      case "loaded":
        if (this.props.heatMap) {
          return (
            <div className={styles.heatMap}>
              <HeatLineChart {...this.props.heatMap} hash={this.props.uuid} />
            </div>
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
      this.props.getHeatMap();
    }
    this.setState({ isGraphOpen: willGraphOpen });
  };
}

export function Empty(props: { emptyMessage?: string }) {
  return (
    <tbody>
      <tr className={styles.empty} data-testid="empty-message">
        <td colSpan={5}>{props.emptyMessage}</td>
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
