import * as React from "react";
import Link from "./Link";
import styles from "./SnapshotList.scss";

export interface IRowData {
  uuid: string;
  name: string;
  environment: string;
  pod: string;
  createdAt: string;
  labels: string[];
  link: string;
  isReady: boolean;
}

export interface IProperty {
  rows: IRowData[];
  emptyMessage?: string;
}

class SnapshotList extends React.Component<IProperty> {
  public render() {
    return (
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UUID</th>
              <th>Name</th>
              <th>Pod Name</th>
              <th>Environment</th>
              <th>Created at</th>
              <th>Link</th>
            </tr>
          </thead>
          {this.props.rows.map(r => (
            <tbody key={r.uuid}>
              <tr>
                <td>{r.uuid}</td>
                <td>{r.name}</td>
                <td>{r.pod}</td>
                <td>{r.environment}</td>
                <td>{r.createdAt}</td>
                <td>
                  <Link href={r.link}>Framescope</Link>
                </td>
              </tr>
            </tbody>
          ))}
          {this.props.rows.length === 0 && (
            <tbody>
              <tr className={styles.empty}>
                <td colSpan={6}>{this.props.emptyMessage}</td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    );
  }
}

export default SnapshotList;
