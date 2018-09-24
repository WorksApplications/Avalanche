import { Component, h } from "preact";
import PodCard, { IProperty as IPodCardProperty } from "./PodCard";
// @ts-ignore
import styles from "./PodCardList.scss";

export interface IProperty {
  data: Array<IPodCardProperty & { id: string }>;
  noDataMessage?: string;
  kind: string;
}

class PodCardList extends Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.kindWrap}>
          <span className={styles.kind}>{this.props.kind}</span>
        </div>
        {this.props.data && this.props.data.length > 0 ? (
          <div>
            {this.props.data.map(x => {
              return <PodCard key={x.id} {...x} />;
            })}
          </div>
        ) : (
          <div className={styles.empty}>{this.props.noDataMessage}</div>
        )}
      </div>
    );
  }
}

export default PodCardList;
