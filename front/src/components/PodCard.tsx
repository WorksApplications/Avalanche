import { Component, h } from "preact";
import AliveIndicator from "./AliveIndicator";
// @ts-ignore
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt: string;
  app: string;
  environment: string;
  snapshots: string[];
  isAlive: boolean;

  onSaveButtonClick?(): void;
}

class PodList extends Component<IProperty, {}> {
  public render() {
    const onSave = this.props.onSaveButtonClick || (() => undefined);
    const hashPart = this.props.name.startsWith(this.props.app)
      ? this.props.name.substring(this.props.app.length)
      : "";

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
            <span className={styles.saveTooltip}>Save snapshot</span>
            Save
          </div>
          <div className={styles.indicatorWrap}>
            <div className={styles.aliveIndicator}>
              <AliveIndicator isAlive={this.props.isAlive} />
            </div>
          </div>
          {hashPart ? (
            <span className={styles.name}>
              <span className={styles.appName}>{this.props.app}</span>
              <span className={styles.hashPart}>{hashPart}</span>
            </span>
          ) : (
            <span className={styles.name}>{this.props.name}</span>
          )}
          <div className={styles.info}>
            <span className={styles.environment}>{this.props.environment}</span>
            <span className={styles.createdAt}>{this.props.createdAt}</span>
          </div>
        </div>
        {/* TODO show list of Snapshots on click */}
      </div>
    );
  }
}

export default PodList;
