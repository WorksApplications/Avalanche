import { Component, h } from "preact";
import Router, { Route } from "preact-router";
import NavigationView from "./NavigationView";
import SnapshotPage from "./SnapshotPage";
// @ts-ignore
import styles from "./Workspace.scss";

class Workspace extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <NavigationView />
        </nav>
        <main className={styles.main}>
          <Router>
            <Route component={SnapshotPage} path="/" default={true} />
          </Router>
        </main>
      </div>
    );
  }
}

export default Workspace;
