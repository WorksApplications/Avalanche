import * as React from "react";
import * as ReactModal from "react-modal";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  addEnvironmentConfigOperation,
  getEnvironmentConfigsOperation,
  postEnvironmentConfigOperation,
  toastr
} from "../actions";
import EnvironmentCardList from "../components/EnvironmentCardList";
import EnvironmentConfigAddModal from "../components/EnvironmentConfigAddModal";
import EnvironmentConfigModifyModal from "../components/EnvironmentConfigModifyModal";
import FabButton from "../components/FabButton";
import FilterInput from "../components/FilterInput";
import { operationsToActionCreators } from "../helpers";
import modalStyles from "../Modal.scss";
import { IApplicationState } from "../store";
import styles from "./ConfigPage.scss";

const initialState = {
  filteringValue: "",
  showsModifyDialog: false,
  showsAddDialog: false,
  dialogTarget: null as string | null,
  isMultitenant: null as boolean | null,
  kubernetesApi: null as string | null,
  version: null as string | null
};

type State = Readonly<typeof initialState>;

const mapStateToProps = (state: IApplicationState) => ({
  environmentConfigs: state.environmentConfig.environmentConfigs
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      toastr,
      ...operationsToActionCreators({
        getEnvironmentConfigsOperation,
        postEnvironmentConfigOperation,
        addEnvironmentConfigOperation
      })
    },
    dispatch
  );

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

export class ConfigPage extends React.Component<Props, State> {
  private static normalizeApiBase(apiBase: string): string {
    const trimed = apiBase.trim();
    return trimed.endsWith("/")
      ? trimed.substring(0, trimed.length - 1)
      : trimed;
  }
  public readonly state: State = initialState;

  public componentDidMount() {
    this.updateConfigData();
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

        <FabButton
          tooltip="Add environment"
          onClick={this.addEnvironment.bind(this)}
          icon="wap-icon-add"
        />
        <ReactModal
          isOpen={this.state.showsModifyDialog}
          overlayClassName={modalStyles.overlay}
          className={modalStyles.inner}
        >
          <EnvironmentConfigModifyModal
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
        </ReactModal>
        <ReactModal
          isOpen={this.state.showsAddDialog}
          overlayClassName={modalStyles.overlay}
          className={modalStyles.inner}
        >
          <EnvironmentConfigAddModal
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
        </ReactModal>
      </div>
    );
  }

  private updateConfigData() {
    this.props.getEnvironmentConfigsOperation().catch(() => {
      this.props.toastr(`Failed to get environment configs.`, "error");
    });
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
    const version = this.state.version!;
    const environmentName = this.state.dialogTarget!;
    this.props
      .postEnvironmentConfigOperation({
        environmentName,
        isMultitenant: this.state.isMultitenant!,
        kubernetesApi: ConfigPage.normalizeApiBase(this.state.kubernetesApi!),
        version
      })
      .then(({ config }) => {
        this.props.toastr(`Config for "${config.name}" is updated.`, "success");
        this.updateConfigData();
      })
      .catch(() => {
        this.props.toastr(`Failed to configure "${environmentName}".`, "error");
      });
    this.onModifyDialogDismiss();
  }

  private onAddDialogAccept() {
    const environmentName = this.state.dialogTarget!;
    this.props
      .addEnvironmentConfigOperation({
        environmentName,
        isMultitenant: this.state.isMultitenant!,
        kubernetesApi: ConfigPage.normalizeApiBase(this.state.kubernetesApi!),
        version: this.state.version!
      })
      .then(({ config }) => {
        this.props.toastr(`Config for "${config.name}" is added.`, "success");
        this.updateConfigData();
      })
      .catch(() => {
        this.props.toastr(`Failed to add "${environmentName}".`, "error");
      });
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfigPage);
