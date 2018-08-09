import { Component, h } from "preact";
import AppSelector from "../AppSelector";
// @ts-ignore
import styles from "./NavigationView.scss";

class NavigationView extends Component {
  public render() {
    const tmpData = [{ label: "a", value: "a" }, { label: "b", value: "b" }];
    // TODO connect, store
    return (
      <div className={styles.wrap}>
        <div>
          <AppSelector
            options={tmpData}
            onValueChanged={this.onAppChanged.bind(this)}
            placeholder="Select landscape"
          />
        </div>
        <div className={styles.viewList}>
          <div className={[styles.viewItem, styles.selected].join(" ")}>
            Snapshots
          </div>
        </div>
        {/* This will be config & login */}
      </div>
    );
  }
  private onAppChanged(app: string) {
    // TODO execute action
    alert(app);
  }
}

export default NavigationView;
