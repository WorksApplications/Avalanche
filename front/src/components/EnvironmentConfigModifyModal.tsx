/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import styles from "../Modal.scss";

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

export class EnvironmentConfigModifyModal extends React.Component<IProperty> {
  public render() {
    // TODO url validation
    const isValidData =
      this.props.isMultitenant !== null &&
      this.props.kubernetesApi !== null &&
      this.props.version != null;

    return (
      <div className={styles.body}>
        <div className={styles.header}>
          Configure environment: {this.props.target}
        </div>
        <div className={styles.content}>
          <div className={styles.group}>
            <label className={styles.label}>Tenant Kind</label>
            <div className={styles.radioInput}>
              <input
                type="radio"
                id="kind-mt"
                name="kind"
                value="mt"
                checked={this.props.isMultitenant === true}
                onChange={this.onIsMultitenantChange}
              />
              <label htmlFor="kind-mt">MT</label>
              <input
                type="radio"
                id="kind-st"
                name="kind"
                value="st"
                checked={this.props.isMultitenant === false}
                onChange={this.onIsMultitenantChange}
              />
              <label htmlFor="kind-st">ST</label>
              {/*<div className={dialogStyles.description}>a</div>*/}
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Kubernetes API</label>
            <div className={styles.textInput}>
              <input
                type="text"
                name="api"
                onChange={this.onKubernetesApiChange}
                value={this.props.kubernetesApi || ""}
              />
              <div className={styles.description}>
                {"ex: http://k8s-mischo.internal.worksap.com:52063"}
              </div>
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>HUE Version</label>
            <div className={styles.radioInput}>
              <input
                type="radio"
                id="ver-b1712"
                name="version"
                value="-17.12"
                checked={this.props.version === "-17.12"}
                onChange={this.onVersionChange}
              />
              <label htmlFor="ver-b1712">Before 17.12</label>
              <input
                type="radio"
                id="ver-a1803"
                name="version"
                value="18.03-"
                checked={this.props.version === "18.03-"}
                onChange={this.onVersionChange}
              />
              <label htmlFor="ver-a1803">After 18.03</label>
              {/*<div className={dialogStyles.description}>a</div>*/}
            </div>
          </div>
        </div>
        <div className={styles.navigation}>
          <button className={styles.cancel} onClick={this.props.onDismiss}>
            <span>Cancel</span>
          </button>
          <button
            className={styles.apply}
            onClick={this.props.onAccept}
            disabled={!isValidData}
          >
            <span>Apply</span>
          </button>
        </div>
      </div>
    );
  }

  private onIsMultitenantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onIsMultitenantChange(e.target.value === "mt");
  };

  private onKubernetesApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onKubernetesApiChange(e.target.value);
  };

  private onVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onVersionChange(e.target.value);
  };
}

export default EnvironmentConfigModifyModal;
