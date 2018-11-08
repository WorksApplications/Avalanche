import * as React from "react";
import styles from "./EnvironmentCard.scss";

export interface IProperty {
  name: string;
  version?: string;
  kind: "unconfigured" | "configured" | "observed";

  switchEnabled?(): void;

  onEdit(): void;
}

export class EnvironmentCard extends React.Component<IProperty> {
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
      <div className={[styles.wrap, kind].join(" ")} data-testid="root">
        <div className={styles.name}>{this.props.name}</div>
        {this.props.version && (
          <div className={styles.version}>version {this.props.version}</div>
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
        <button
          className={styles.edit}
          onClick={this.props.onEdit.bind(this)}
          role="button"
          data-testid="edit-button"
        >
          <span className={styles.editToolbar}>Edit this environment</span>
          <span className={styles.editLabel}>Edit</span>
        </button>
      </div>
    );
  }
}

export default EnvironmentCard;
