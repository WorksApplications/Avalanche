import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { getEnvironmentConfigs, postEnvironmentConfig } from "../actions";
import EnvironmentConfigDialog from "../components/dialogs/EnvironmentConfigDialog";
import EnvironmentCardList from "../components/EnvironmentCardList";
import EnvironmentModalDialogFoundation from "../components/EnvironmentModalDialogFoundation";
import FilterInput from "../components/FilterInput";
import { IApplicationState, IEnvironmentConfig } from "../store";
// @ts-ignore
import styles from "./ConfigPage.scss";

interface IState {
  filteringValue: string;
  showsDialog: boolean;
  dialogTarget: string | null;
  isMultitenant: boolean | null;
  kubeApi: string | null;
  version: "before_17_12" | "after_18_03" | null;
}

interface IStateProps {
  environmentConfigs: IEnvironmentConfig[];
}

interface IDispatchProps {
  getEnvironmentConfigs: typeof getEnvironmentConfigs;
  postEnvironmentConfig: typeof postEnvironmentConfig;
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  environmentConfigs: state.environmentConfig.environmentConfigs
});
const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators(
    { getEnvironmentConfigs, postEnvironmentConfig },
    dispatch
  );

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class ConfigPage extends Component<IStateProps & IDispatchProps, IState> {
  constructor() {
    super();
    this.state = {
      filteringValue: "",
      showsDialog: false,
      dialogTarget: null,
      isMultitenant: null,
      kubeApi: null,
      version: null
    };
  }

  public componentWillMount() {
    this.props.getEnvironmentConfigs();
  }

  public render() {
    const setState = this.setState.bind(this);
    let configs = this.props.environmentConfigs.map(x => {
      const kind = (x.version === null
        ? "unconfigured"
        : x.isObservationEnabled
          ? "observed"
          : "configured") as any;
      let version: "before_17_12" | "after_18_03" | undefined;
      switch (x.version) {
        case "before 17.12":
          version = "before_17_12";
          break;
        case "after 18.03":
          version = "after_18_03";
          break;
        default:
          version = undefined;
      }
      return {
        ...x,
        id: x.name,
        version,
        kind,
        onEdit() {
          setState({
            showsDialog: true,
            dialogTarget: x.name,
            isMultitenant: x.isMultiTenant,
            kubeApi: x.kubeApi,
            version
          });
        }
      };
    });

    if (this.state.filteringValue) {
      // tmpData = tmpData.filter(x => x.name.includes(this.state.filteringValue));
      configs = configs.filter(x => x.name.includes(this.state.filteringValue));
    }

    const onDismiss = () => {
      this.setState({
        showsDialog: false,
        dialogTarget: null,
        isMultitenant: null,
        kubeApi: null,
        version: null
      });
    };
    const onAccept = () => {
      const version = this.state.version!; // TODO convert to proper value
      this.props.postEnvironmentConfig(
        this.state.dialogTarget!,
        this.state.isMultitenant!,
        this.state.kubeApi!,
        version
      );
      onDismiss();
    };
    const onIsMultitenantChange = (isMultiTenant: boolean) => {
      this.setState({ isMultitenant: isMultiTenant });
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
        isMultitenant={this.state.isMultitenant}
        onIsMultitenantChange={onIsMultitenantChange}
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
          <EnvironmentCardList data={configs} />
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

  // noinspection JSUnusedLocalSymbols
  private onFilterChange(previous: string, current: string) {
    this.setState({ filteringValue: current });
  }
}

export default (ConfigPage as any) as FunctionalComponent;
