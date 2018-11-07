import * as React from "react";
import { NavLink } from "react-router-dom";
import { APP_NAME } from "../constants";
import styles from "./TitleBar.scss";

export class TitleBar extends React.Component {
  public render() {
    return (
      <nav className={styles.main}>
        <NavLink className={styles.brand} to={"/"}>
          {APP_NAME}
        </NavLink>
      </nav>
    );
  }
}

export default TitleBar;
