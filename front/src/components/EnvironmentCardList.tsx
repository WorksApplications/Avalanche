/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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
import EnvironmentCard, { IEnvironmentCardProperty } from "./EnvironmentCard";
import styles from "./EnvironmentCardList.scss";

export interface IProperty {
  data: Array<IEnvironmentCardProperty & { id: string }>;
  noDataMessage?: string;
}

export class EnvironmentCardList extends React.Component<IProperty> {
  public render() {
    const isNotEmpty = this.props.data && this.props.data.length > 0;
    return (
      <div
        className={[
          styles.wrap,
          !isNotEmpty ? styles.emptyWrap : undefined
        ].join(" ")}
      >
        {isNotEmpty ? (
          <div className={styles.cards}>
            {this.props.data.map(x => (
              <div key={x.id} className={styles.card}>
                <EnvironmentCard {...x} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <i className="material-icons">search</i>
            </div>
            <div className={styles.emptyTitle}>{this.props.noDataMessage}</div>
          </div>
        )}
      </div>
    );
  }
}

export default EnvironmentCardList;
