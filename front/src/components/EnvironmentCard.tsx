import { Component, h } from "preact";
// @ts-ignore
import styles from "./EnvironmentCard.scss";

export interface IProperty {
  name: string;
  version?: string;
  nOfMonitored?: number;
  nOfSnapshot?: number;
  kind: "unconfigured" | "configured" | "observed";

  switchEnabled?(): void;

  onEdit(): void;
}

class EnvironmentCard extends Component<IProperty, {}> {
  public render() {
    let kind: string | null = null;
    switch (this.props.kind) {
      case "unconfigured":
        kind = styles.unconfigured;
        break;
      case "configured":
        kind = styles.configured;
        break;
      case "observed":
        kind = styles.observed;
        break;
    }
    return (
      <div className={[styles.wrap, kind].join(" ")}>
        <div className={styles.name}>{this.props.name}</div>
        {this.props.version && (
          <div className={styles.version}>version {this.props.version}</div>
        )}
        {this.props.nOfMonitored && (
          <div className={styles.nOfMonitored}>
            {this.props.nOfMonitored} monitored pods
          </div>
        )}
        {this.props.nOfSnapshot && (
          <div className={styles.nOfSnapshot}>
            {this.props.nOfSnapshot} snapshots
          </div>
        )}
        {(this.props.kind === "configured" ||
          this.props.kind === "observed") && (
          <a
            className={styles.switchEnabled}
            onClick={this.props.switchEnabled}
          >
            Observation is{" "}
            {this.props.kind === "observed" ? "Enabled" : "Disabled"}
          </a>
        )}
        <a className={styles.edit} onClick={this.props.onEdit.bind(this)}>
          Edit
        </a>
      </div>
    );
  }
}

export default EnvironmentCard;
