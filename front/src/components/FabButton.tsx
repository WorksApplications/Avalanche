import * as React from "react";
import styles from "./FabButton.scss";

interface IProperty {
  tooltip: string;
  icon: string;
  onClick(): void;
}

export const FabButton: React.StatelessComponent<IProperty> = ({
  ...props
}) => (
  <div className={styles.wrap} onClick={props.onClick}>
    <div className={styles.innerWrap}>
      <span className={styles.tooltip}>{props.tooltip}</span>
      <i className={["material-icons", styles.icon].join(" ")}>{props.icon}</i>
    </div>
  </div>
);
export default FabButton;
