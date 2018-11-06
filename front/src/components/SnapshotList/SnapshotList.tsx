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
            <tbody key={r.uuid} data-testid="snapshot">
              <tr>
                <td>{r.uuid}</td>
                <td>{r.podName}</td>
                <td>{r.environment}</td>
                <td data-testid="snapshot-date">
                  {(r.createdAt && r.createdAt.toLocaleString()) || "Unknown"}
                </td>
                <td>
                  <Link href={r.link}>Framescope</Link>
                </td>
              </tr>
            </tbody>
          ))}
          {this.props.rows.length === 0 && (
            <tbody>
              <tr className={styles.empty} data-testid="empty-message">
                <td colSpan={5}>{this.props.emptyMessage}</td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    );
  }
}

export default SnapshotList;
