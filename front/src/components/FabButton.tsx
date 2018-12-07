import * as React from "react";
import styles from "./FabButton.scss";

interface IProperty {
  tooltip: string;
  icon: string;
  onClick(): void;
}

export const FabButton: React.FunctionComponent<IProperty> = ({ ...props }) => (
  <>
    <div
      className={styles.wrap}
      onClick={props.onClick}
      data-tip={props.tooltip}
      data-place="left"
      data-class={styles.tooltip}
    >
      <div className={styles.innerWrap}>
        <i className={["material-icons", styles.icon].join(" ")}>
          {props.icon}
        </i>
      </div>
    </div>
  </>
);
export default FabButton;
