import * as React from "react";
// @ts-ignore
import styles from "./AliveIndicator.scss";

interface IProperty {
  isAlive: boolean;
}

const AliveIndicator: React.StatelessComponent<IProperty> = ({ ...props }) => (
  <div className={styles.wrap}>
    <div
      className={[
        styles.indicator,
        props.isAlive ? styles.alive : styles.dead
      ].join(" ")}
    />
  </div>
);
export default AliveIndicator;
