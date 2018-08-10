import { Component, h } from "preact";
import PodCard, { IProperty as IPodCardProperty } from "./PodCard";
// @ts-ignore
import styles from "./PodCardList.scss";

export interface IProperty {
  data: Array<IPodCardProperty & { id: string }>;
  kind: string;
}

class PodCardList extends Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.kindWrap}>
          <span className={styles.kind}>{this.props.kind}</span>
        </div>
        <div>{this.props.data.map(x => <PodCard key={x.id} {...x} />)}</div>
      </div>
    );
  }
}

export default PodCardList;
