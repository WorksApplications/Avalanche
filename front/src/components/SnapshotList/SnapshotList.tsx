// tslint:disable:max-classes-per-file
import * as React from "react";
import Link from "../Link";
import styles from "./SnapshotList.scss";

export interface IData {
  uuid: string;
  environment: string;
  podName: string;
  createdAt?: Date;
  link: string;
}

// This child component is tightly coupled as a table row element
export class SnapshotItem extends React.Component<IData> {
  public render() {
    return (
      <tbody data-testid="snapshot">
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
      </tbody>
    );
  }
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
  rows: IData[];
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
          {this.props.rows.map(r => (
            <SnapshotItem key={r.uuid} {...r} />
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
