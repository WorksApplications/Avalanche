import * as React from "react";
import * as ReactTooltip from "react-tooltip";
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
      data-for="fab"
    >
      <div className={styles.innerWrap}>
        <i className={["material-icons", styles.icon].join(" ")}>
          {props.icon}
        </i>
      </div>
    </div>
    <ReactTooltip
      id="fab"
      effect="solid"
      place="left"
      aria-haspopup="true"
      className={styles.tooltip}
    />
  </>
);
export default FabButton;
