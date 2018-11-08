import * as React from "react";
import styles from "./Spinner.scss";

const Spinner: React.StatelessComponent = () => (
  <svg className={styles.spinner} viewBox="0 0 50 50">
    <circle
      className={styles.dash}
      fill="none"
      strokeWidth="4"
      strokeLinecap="round"
      cx="25"
      cy="25"
      r="20"
      strokeMiterlimit="10"
    />
  </svg>
);
export default Spinner;
