import * as React from "react";
// @ts-ignore
import dialogStyles from "../EnvironmentModalDialogFoundation.scss";

export interface IProperty {
  target: string;
  isMultitenant: boolean | null;
  kubernetesApi: string | null;
  version: string | null;

  onIsMultitenantChange(isMultitenant: boolean): void;

  onKubernetesApiChange(api: string): void;

  onVersionChange(version: string): void;

  onDismiss(): void;

  onAccept(): void;
}

class EnvironmentConfigModifyDialog extends React.Component<IProperty, {}> {
  public render() {
    // TODO url validation
    const isValidData =
      this.props.isMultitenant !== null &&
      this.props.kubernetesApi !== null &&
      this.props.version != null;

    return (
      <div className={dialogStyles.body}>
        <div className={dialogStyles.header}>
          Configure environment: {this.props.target}
        </div>
        <div className={dialogStyles.content}>
          <div className={dialogStyles.group}>
            <label className={dialogStyles.label}>Tenant Kind</label>
            <div className={dialogStyles.input}>
              <input
                type="radio"
                id="kind-mt"
                name="kind"
                value="mt"
                checked={this.props.isMultitenant === true}
                onChange={this.onIsMultitenantChange.bind(this)}
              />
              <label htmlFor="kind-mt">MT</label>
              <input
                type="radio"
                id="kind-st"
                name="kind"
                value="st"
                checked={this.props.isMultitenant === false}
                onChange={this.onIsMultitenantChange.bind(this)}
              />
              <label htmlFor="kind-st">ST</label>
              {/*<div className={dialogStyles.description}>a</div>*/}
            </div>
          </div>
          <div className={dialogStyles.group}>
            <label className={dialogStyles.label}>Kubernetes API</label>
            <div className={dialogStyles.input}>
              <input
                type="text"
                name="api"
                onChange={this.onKubernetesApiChange.bind(this)}
                value={this.props.kubernetesApi || ""}
              />
              <div className={dialogStyles.description}>
                {"ex: http://k8s-mischo.internal.worksap.com:52063/"}
              </div>
            </div>
          </div>
          <div className={dialogStyles.group}>
            <label className={dialogStyles.label}>HUE Version</label>
            <div className={dialogStyles.input}>
              <input
                type="radio"
                id="ver-b1712"
                name="version"
                value="-17.12"
                checked={this.props.version === "-17.12"}
                onChange={this.onVersionChange.bind(this)}
              />
              <label htmlFor="ver-b1712">Before 17.12</label>
              <input
                type="radio"
                id="ver-a1803"
                name="version"
                value="18.03-"
                checked={this.props.version === "18.03-"}
                onChange={this.onVersionChange.bind(this)}
              />
              <label htmlFor="ver-a1803">After 18.03</label>
              {/*<div className={dialogStyles.description}>a</div>*/}
            </div>
          </div>
        </div>
        <div className={dialogStyles.navigation}>
          <button
            className={dialogStyles.cancel}
            onClick={this.props.onDismiss}
          >
            <span>Cancel</span>
          </button>
          <button
            className={dialogStyles.apply}
            onClick={this.props.onAccept}
            disabled={!isValidData}
          >
            <span>Apply</span>
          </button>
        </div>
      </div>
    );
  }

  private onIsMultitenantChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.props.onIsMultitenantChange(value === "mt");
  }

  private onKubernetesApiChange(e: Event) {
    this.props.onKubernetesApiChange((e.target as HTMLInputElement)
      .value as string);
  }

  private onVersionChange(e: Event) {
    this.props.onVersionChange((e.target as HTMLInputElement).value as string);
  }
}

export default EnvironmentConfigModifyDialog;
