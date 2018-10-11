import * as React from "react";
import PodCard, { IProperty as IPodCardProperty } from "./PodCard";
// @ts-ignore
import styles from "./PodCardList.scss";

export interface IProperty {
  data: Array<IPodCardProperty & { id: string }>;
  noDataMessage?: string;
  kind: string;
}

class PodCardList extends React.Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap} data-test="root">
        <div className={styles.kindWrap}>
          <span className={styles.kind}>{this.props.kind}</span>
        </div>
        {this.props.data && this.props.data.length > 0 ? (
          <ul className={styles.cardList} data-test="card-list">
            {this.props.data.map(x => {
              return (
                <li className={styles.card} key={x.id}>
                  <PodCard {...x} />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty} data-test="empty-message">
            {this.props.noDataMessage}
          </div>
        )}
      </div>
    );
  }
}

export default PodCardList;
