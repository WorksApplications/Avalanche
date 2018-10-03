import * as React from "react";
// @ts-ignore
import styles from "./EnvironmentModalDialogFoundation.scss";

class EnvironmentModalDialogFoundation extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>{this.props.children}</div>
      </div>
    );
  }
}

export default EnvironmentModalDialogFoundation;
