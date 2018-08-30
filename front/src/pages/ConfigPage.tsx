import { Component, h } from "preact";
import EnvironmentConfigDialog from "../components/dialogs/EnvironmentConfigDialog";
import { IProperty as IEnvironmentCardProperty } from "../components/EnvironmentCard";
import EnvironmentCardList from "../components/EnvironmentCardList";
import EnvironmentModalDialogFoundation from "../components/EnvironmentModalDialogFoundation";
import FilterInput from "../components/FilterInput";
// @ts-ignore
import styles from "./ConfigPage.scss";

interface IState {
  filteringValue: string;
  showsDialog: boolean;
  dialogTarget: string | null;
  kind: "mt" | "st" | null;
  kubeApi: string | null;
  version: "before_17_12" | "after_18_03" | null;
}

class ConfigPage extends Component<{}, IState> {
  constructor() {
    super();
    this.state = {
      filteringValue: "",
      showsDialog: false,
      dialogTarget: null,
      kind: null,
      kubeApi: null,
      version: null
    };
  }

  public render() {
    // TODO change it to actual thing
    let tmpData: Array<IEnvironmentCardProperty & { id: string }> = [
      {
        id: "a",
        name: "a",
        kind: "unconfigured",
        onEdit: () => {
          this.setState({ showsDialog: true, dialogTarget: "a" });
        }
      },
      {
        id: "b",
        name: "b",
        kind: "configured",
        version: "18.07",
        nOfMonitored: 12,
        nOfSnapshot: 123,
        onEdit: () => {
          this.setState({ showsDialog: true, dialogTarget: "b" });
        }
      },
      {
        id: "c",
        name: "c",
        kind: "observed",
        version: "18.09",
        nOfMonitored: 23,
        nOfSnapshot: 234,
        onEdit: () => {
          this.setState({ showsDialog: true, dialogTarget: "c" });
        }
      }
    ];
    tmpData.push(...tmpData.map(x => ({ ...x })));
    tmpData.push(...tmpData.map(x => ({ ...x })));
    tmpData.forEach(x => {
      x.id = Math.random().toString();
    });

    if (this.state.filteringValue) {
      tmpData = tmpData.filter(x => x.name.includes(this.state.filteringValue));
    }

    const onDismiss = () => {
      this.setState({
        showsDialog: false,
        dialogTarget: null,
        kind: null,
        kubeApi: null,
        version: null
      });
    };
    const onAccept = () => {
      // TODO post with API
      console.log(
        this.state.dialogTarget,
        this.state.kind,
        this.state.kubeApi,
        this.state.version
      );
      onDismiss();
    };
    const onKindChange = (kind: "mt" | "st") => {
      this.setState({ kind });
    };
    const onKubeApiChange = (kubeApi: string) => {
      this.setState({ kubeApi });
    };
    const onVersionChange = (version: "before_17_12" | "after_18_03") => {
      this.setState({ version });
    };
    const dialogContent = (
      <EnvironmentConfigDialog
        target={this.state.dialogTarget || ""}
        onDismiss={onDismiss}
        onAccept={onAccept}
        kind={this.state.kind}
        onKindChange={onKindChange}
        kubeApi={this.state.kubeApi}
        onKubeApiChange={onKubeApiChange}
        version={this.state.version}
        onVersionChange={onVersionChange}
      />
    );

    return (
      <div className={styles.wrap}>
        <div className={styles.filter}>
          <FilterInput
            placeholder="Filter with..."
            onValueChange={this.onFilterChange.bind(this)}
          />
        </div>
        <div className={styles.cardList}>
          <EnvironmentCardList data={tmpData} />
        </div>
        <div
          className={[
            styles.modalDialog,
            this.state.showsDialog ? styles.open : styles.close
          ].join(" ")}
        >
          <EnvironmentModalDialogFoundation dialogToShow={dialogContent} />
        </div>
      </div>
    );
  }

  private onFilterChange(previous: string, current: string) {
    this.setState({ filteringValue: current });
  }
}

export default ConfigPage;
