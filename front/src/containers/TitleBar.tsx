import { Component, h } from "preact";
// @ts-ignore
import styles from "./TitleBar.scss";

class TitleBar extends Component {
  public render() {
    return (
      <nav className={styles.main}>
        <span className={styles.brand}>Dynamic analysis</span>
      </nav>
    );
  }
}

export default TitleBar;
