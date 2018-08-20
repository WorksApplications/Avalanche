import { Component, h } from "preact";
// @ts-ignore
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt: string;
  app: string;
  environment: string;
  snapshots: string[];

  onSaveButtonClick?(): void;
}

class PodList extends Component<IProperty, {}> {
  public render() {
    const onSave = this.props.onSaveButtonClick || (() => undefined);
    return (
      <div className={styles.wrap}>
        <div>
          <div
            className={[
              styles.saveButton,
              !this.props.onSaveButtonClick ? styles.disabled : undefined
            ].join(" ")}
            onMouseDown={onSave}
          >
            <span className={styles.saveTooltip}>Save snapshot</span>Save
          </div>
          <span className={styles.name}>{this.props.name}</span>
          <span className={styles.createdAt}>{this.props.createdAt}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.infoTop}>
            {this.props.app}&nbsp;&nbsp;{this.props.environment}
          </div>
          {/* TODO show list of Snapshots */}
        </div>
      </div>
    );
  }
}

export default PodList;
