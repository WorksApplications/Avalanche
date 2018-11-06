import * as React from "react";
import { APP_NAME } from "../constants";
import styles from "./TitleBar.scss";

export class TitleBar extends React.Component {
  public render() {
    return (
      <nav className={styles.main}>
        <a className={styles.brand} href={"/"}>
          {APP_NAME}
        </a>
      </nav>
    );
  }
}

export default TitleBar;
