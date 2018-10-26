import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import {
  addEnvironmentConfigThunk,
  getEnvironmentConfigsThunk,
  postEnvironmentConfigThunk,
  toastr
} from "../actions";
import EnvironmentConfigAddDialog from "../components/dialogs/EnvironmentConfigAddDialog";
import EnvironmentConfigModifyDialog from "../components/dialogs/EnvironmentConfigModifyDialog";
import EnvironmentCardList from "../components/EnvironmentCardList";
import EnvironmentModalDialogFoundation from "../components/EnvironmentModalDialogFoundation";
import FabButton from "../components/FabButton";
import FilterInput from "../components/FilterInput";
import { OperationsToProps, thunkToActionBulk } from "../helpers";
import { IApplicationState, IEnvironmentConfig } from "../store";
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

const actions = {
  toastr
};

const operations = {
  getEnvironmentConfigsThunk,
  postEnvironmentConfigThunk,
  addEnvironmentConfigThunk
};

type IDispatchProps = typeof actions & OperationsToProps<typeof operations>;

type IProps = IStateProps & IDispatchProps;

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  environmentConfigs: state.environmentConfig.environmentConfigs
});
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    { ...actions, ...thunkToActionBulk(operations) },
    dispatch
  );

export class ConfigPage extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
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

  public componentDidMount() {
    this.props.getEnvironmentConfigsThunk().catch(() => {
      this.props.toastr(`Failed to get environment configs.`, "error");
    });
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

        {/* dialog to modify */}
        <div
          className={[
            styles.modalDialog,
            this.state.showsModifyDialog ? styles.open : styles.close
          ].join(" ")}
        >
          {this.state.showsModifyDialog && (
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
          )}
        </div>
        {/*dialog to add*/}
        <div
          className={[
            styles.modalDialog,
            this.state.showsAddDialog ? styles.open : styles.close
          ].join(" ")}
        >
          <EnvironmentModalDialogFoundation>
            {this.state.showsAddDialog && (
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
            )}
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
    const version = this.state.version!;
    const environmentName = this.state.dialogTarget!;
    this.props
      .postEnvironmentConfigThunk({
        environmentName,
        isMultitenant: this.state.isMultitenant!,
        kubernetesApi: this.state.kubernetesApi!,
        version
      })
      .then(({ config }) => {
        this.props.toastr(`Config for "${config.name}" is updated.`, "success");
      })
      .catch(() => {
        this.props.toastr(`Failed to configure "${environmentName}".`, "error");
      });
    this.onModifyDialogDismiss();
  }

  private onAddDialogAccept() {
    const environmentName = this.state.dialogTarget!;
    this.props
      .addEnvironmentConfigThunk({
        environmentName,
        isMultitenant: this.state.isMultitenant!,
        kubernetesApi: this.state.kubernetesApi!,
        version: this.state.version!
      })
      .then(({ config }) => {
        this.props.toastr(`Config for "${config.name}" is added.`, "success");
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
)(ConfigPage) as React.ComponentClass;
