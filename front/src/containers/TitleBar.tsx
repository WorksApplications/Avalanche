import * as React from "react";
import { APP_NAME } from "../constants";
// @ts-ignore
import styles from "./TitleBar.scss";

class TitleBar extends React.Component {
  public render() {
    return (
      <nav className={styles.main}>
        <span className={styles.brand}>{APP_NAME}</span>
      </nav>
    );
  }
}

export default TitleBar;
