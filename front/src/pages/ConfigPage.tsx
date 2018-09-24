import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  addEnvironmentConfig,
  getEnvironmentConfigs,
  postEnvironmentConfig
} from "../actions";
import EnvironmentConfigAddDialog from "../components/dialogs/EnvironmentConfigAddDialog";
import EnvironmentConfigModifyDialog from "../components/dialogs/EnvironmentConfigModifyDialog";
import EnvironmentCardList from "../components/EnvironmentCardList";
import EnvironmentModalDialogFoundation from "../components/EnvironmentModalDialogFoundation";
import FabButton from "../components/FabButton";
import FilterInput from "../components/FilterInput";
import { IApplicationState, IEnvironmentConfig } from "../store";
// @ts-ignore
import styles from "./ConfigPage.scss";

interface IState {
  filteringValue: string;
  showsModifyDialog: boolean;
  showsAddDialog: boolean;
  dialogTarget: string | null;
  isMultitenant: boolean | null;
  kubernetesApi: string | null;
  version: string | null;
}

interface IStateProps {
  environmentConfigs: IEnvironmentConfig[];
}

interface IDispatchProps {
  getEnvironmentConfigs: typeof getEnvironmentConfigs;
  postEnvironmentConfig: typeof postEnvironmentConfig;
  addEnvironmentConfig: typeof addEnvironmentConfig;
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  environmentConfigs: state.environmentConfig.environmentConfigs
});
const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators(
    { getEnvironmentConfigs, postEnvironmentConfig, addEnvironmentConfig },
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
      showsModifyDialog: false,
      showsAddDialog: false,
      dialogTarget: null,
      isMultitenant: null,
      kubernetesApi: null,
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
      return {
        ...x,
        id: x.name,
        version: x.version || undefined,
        kind,
        onEdit() {
          setState({
            showsModifyDialog: true,
            dialogTarget: x.name,
            isMultitenant: x.isMultiTenant,
            kubernetesApi: x.kubernetesApi,
            version: x.version || undefined
          });
        }
      };
    });

    if (this.state.filteringValue) {
      configs = configs.filter(x => x.name.includes(this.state.filteringValue));
    }

    const onTargetChange = (target: string) => {
      this.setState({ dialogTarget: target });
    };

    const onIsMultitenantChange = (isMultiTenant: boolean) => {
      this.setState({ isMultitenant: isMultiTenant });
    };
    const onKubernetesApiChange = (kubernetesApi: string) => {
      this.setState({ kubernetesApi });
    };
    const onVersionChange = (version: string) => {
      this.setState({ version });
    };

    return (
      <div className={styles.wrap}>
        <div className={styles.filter}>
          <FilterInput
            placeholder="Filter with..."
            onValueChange={this.onFilterChange.bind(this)}
          />
        </div>
        <div className={styles.cardList}>
          <EnvironmentCardList
            data={configs}
            noDataMessage={
              this.state.filteringValue
                ? "No config with current filter"
                : "No config"
            }
          />
        </div>

        {/* dialog to modify */}
        <div
          className={[
            styles.modalDialog,
            this.state.showsModifyDialog ? styles.open : styles.close
          ].join(" ")}
        >
          {this.state.showsModifyDialog ? (
            <EnvironmentModalDialogFoundation>
              <EnvironmentConfigModifyDialog
                target={this.state.dialogTarget || ""}
                onDismiss={this.onModifyDialogDismiss.bind(this)}
                onAccept={this.onModifyDialogAccept.bind(this)}
                isMultitenant={this.state.isMultitenant}
                onIsMultitenantChange={onIsMultitenantChange}
                kubernetesApi={this.state.kubernetesApi}
                onKubernetesApiChange={onKubernetesApiChange}
                version={this.state.version}
                onVersionChange={onVersionChange}
              />
            </EnvironmentModalDialogFoundation>
          ) : null}
        </div>

        <FabButton
          tooltip="Add environment"
          onClick={this.addEnvironment.bind(this)}
        >
          ＋
        </FabButton>
        {/*dialog to add*/}
        <div
          className={[
            styles.modalDialog,
            this.state.showsAddDialog ? styles.open : styles.close
          ].join(" ")}
        >
          <EnvironmentModalDialogFoundation>
            {this.state.showsAddDialog ? (
              <EnvironmentConfigAddDialog
                onDismiss={this.onAddDialogDismiss.bind(this)}
                onAccept={this.onAddDialogAccept.bind(this)}
                target={this.state.dialogTarget}
                onTargetApiChange={onTargetChange}
                isMultitenant={this.state.isMultitenant}
                onIsMultitenantChange={onIsMultitenantChange}
                kubernetesApi={this.state.kubernetesApi}
                onKubernetesApiChange={onKubernetesApiChange}
                version={this.state.version}
                onVersionChange={onVersionChange}
              />
            ) : null}
          </EnvironmentModalDialogFoundation>
        </div>
      </div>
    );
  }

  private onModifyDialogDismiss() {
    this.setState({
      showsModifyDialog: false,
      dialogTarget: null,
      isMultitenant: null,
      kubernetesApi: null,
      version: null
    });
  }

  private onAddDialogDismiss() {
    this.setState({
      showsAddDialog: false,
      dialogTarget: null,
      isMultitenant: null,
      kubernetesApi: null,
      version: null
    });
  }

  private onModifyDialogAccept() {
    const version = this.state.version!; // TODO convert to proper value
    this.props.postEnvironmentConfig(
      this.state.dialogTarget!,
      this.state.isMultitenant!,
      this.state.kubernetesApi!,
      version
    );
    this.onAddDialogDismiss();
  }

  private onAddDialogAccept() {
    this.props.addEnvironmentConfig(
      this.state.dialogTarget!,
      this.state.isMultitenant!,
      this.state.kubernetesApi!,
      this.state.version!
    );
    this.onAddDialogDismiss();
  }

  // noinspection JSUnusedLocalSymbols
  private onFilterChange(previous: string, current: string) {
    this.setState({ filteringValue: current });
  }

  private addEnvironment() {
    this.setState({ showsAddDialog: true });
  }
}

export default (ConfigPage as any) as FunctionalComponent;
