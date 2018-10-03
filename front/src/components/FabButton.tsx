import * as React from "react";
// @ts-ignore
import styles from "./FabButton.scss";

interface IProperty {
  tooltip: string;
  icon: string;
  onClick(): void;
}

const FabButton: React.StatelessComponent<IProperty> = ({ ...props }) => (
  <div className={styles.wrap} onClick={props.onClick}>
    <div className={styles.innerWrap}>
      <span className={styles.tooltip}>{props.tooltip}</span>
      <i className={[props.icon, styles.icon].join(" ")} />
    </div>
  </div>
);
export default FabButton;
