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

class SnapshotList extends React.Component<IProperty, {}> {
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
              {/*<th>Labels</th>*/}
              <th>Link</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {this.props.rows.map(r => (
              <tr id={r.uuid}>
                <td>{r.uuid}</td>
                <td>{r.name}</td>
                <td>{r.pod}</td>
                <td>{r.environment}</td>
                <td>{r.createdAt}</td>
                {/*<td>&nbsp;</td>*/}
                <td>
                  <Link href={r.link}>Framescope</Link>
                </td>
                <td className={styles.statusColumn} />
                {/* TODO status */}
              </tr>
            ))}
            {this.props.rows.length === 0 && (
              <tr className={styles.empty}>
                <td colSpan={8}>{this.props.emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default SnapshotList;
