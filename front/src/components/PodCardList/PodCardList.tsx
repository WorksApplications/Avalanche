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
