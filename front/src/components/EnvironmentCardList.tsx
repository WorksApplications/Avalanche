import { Component, h } from "preact";
import EnvironmentCard, {
  IProperty as IEnvironmentCardProperty
} from "./EnvironmentCard";
// @ts-ignore
import styles from "./EnvironmentCardList.scss";

export interface IProperty {
  data: Array<IEnvironmentCardProperty & { id: string }>;
  noDataMessage?: string;
}

class EnvironmentCardList extends Component<IProperty, {}> {
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
            {this.props.data.map(x => {
              return (
                <div key={x.id} className={styles.card}>
                  <EnvironmentCard {...x} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚲</div>
            <div className={styles.emptyTitle}>{this.props.noDataMessage}</div>
          </div>
        )}
      </div>
    );
  }
}

export default EnvironmentCardList;
