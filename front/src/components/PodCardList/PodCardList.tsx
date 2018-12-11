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
import PodCard, { IPodCardProperty } from "../PodCard/index";
import styles from "./PodCardList.scss";

export type ICardListData = Array<IPodCardProperty & { id: string }>;

export interface IProperty {
  data: ICardListData;
  noDataMessage?: string;
  kind: string;
}

export class PodCardList extends React.Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap} data-testid="root">
        <div className={styles.kindWrap}>
          <span className={styles.kind}>{this.props.kind}</span>
        </div>
        {this.props.data && this.props.data.length > 0 ? (
          <ul className={styles.cardList} data-testid="card-list">
            {this.props.data.map(x => (
              <li className={styles.card} key={x.id}>
                <PodCard {...x} />
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty} data-testid="empty-message">
            {this.props.noDataMessage}
          </div>
        )}
      </div>
    );
  }
}

export default PodCardList;
