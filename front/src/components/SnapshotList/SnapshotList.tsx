/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import SnapshotItem, { IProperty as ItemProperty } from "./SnapshotItem";
import styles from "./SnapshotList.scss";

export interface IProperty {
  rows: ItemProperty[];
  emptyMessage?: string;
}

export class SnapshotList extends React.Component<IProperty> {
  public render() {
    return (
      <div className={styles.wrap} data-testid="root">
        <div className={styles.header}>
          <div className={styles.uuidColumn}>UUID</div>
          <div className={styles.podNameColumn}>Pod Name</div>
          <div className={styles.environmentColumn}>Environment</div>
          <div className={styles.createdAtColumn}>Created at</div>
          <div className={styles.linkColumn}>Link</div>
          <div className={styles.expanderColumn} />
        </div>
        <ul className={styles.list}>
          {this.props.rows.map((r, i) => (
            <li className={styles.item} key={r.uuid}>
              <SnapshotItem {...r} openByDefault={i === 0 ? true : undefined} />
            </li>
          ))}
          {this.props.rows.length === 0 && (
            <li className={styles.empty} data-testid="empty-message">
              {this.props.emptyMessage}
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default SnapshotList;
