import { Component, h } from "preact";
import SnapshotsView from "./SnapshotsView";

class MainArea extends Component {
  public render() {
    // In the future, this main area should be switchable
    return <SnapshotsView />;
  }
}

export default MainArea;
