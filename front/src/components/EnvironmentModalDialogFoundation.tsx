import { Component, ComponentChildren, h } from "preact";
// @ts-ignore
import styles from "./EnvironmentModalDialogFoundation.scss";

class EnvironmentModalDialogFoundation extends Component {
  public render({ children }: { children: ComponentChildren }) {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>{children}</div>
      </div>
    );
  }
}

export default EnvironmentModalDialogFoundation;
