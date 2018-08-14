import { Component, h } from "preact";
// @ts-ignore
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt: string;
  app: string;
  environment: string;
  snapshots: string[];
}

class PodList extends Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap}>
        <div>
          <span className={styles.name}>{this.props.name}</span>
          <span className={styles.createdAt}>{this.props.createdAt}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.infoLeft}>
            <div className={styles.appWrap}>
              <span className={styles.app}>app:{this.props.app}</span>
            </div>
            <div className={styles.envWrap}>
              <span className={styles.env}>env:{this.props.environment}</span>
            </div>
          </div>
          <div className={styles.infoRight}> {/* TODO Snapshots */}</div>
        </div>
      </div>
    );
  }
}

export default PodList;
