import { Component, h } from "preact";
// @ts-ignore
import styles from "./EnvironmentModalDialogFoundation.scss";

interface IProperty {
  dialogToShow?: JSX.Element;
}

class EnvironmentModalDialogFoundation extends Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>{this.props.dialogToShow}</div>
      </div>
    );
  }
}

export default EnvironmentModalDialogFoundation;
