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
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { hideToastr } from "../actions";
import { IApplicationState } from "../store";
import styles from "./Toastr.scss";

const mapStateToProps = (state: IApplicationState) => ({
  notifications: state.toastNotification.notifications
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      hideToastr
    },
    dispatch
  );

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

export class Toastr extends React.Component<Props> {
  public render() {
    return (
      <div className={styles.wrap}>
        {this.props.notifications.map(n => {
          const dismissToastr = () => this.props.hideToastr({ id: n.id || 0 });
          return (
            <div
              key={n.id}
              className={[
                styles.toastr,
                n.isShown ? styles.shown : styles.hidden,
                n.message == null
                  ? undefined
                  : n.kind === "success"
                  ? styles.success
                  : n.kind === "error"
                  ? styles.error
                  : undefined
              ].join(" ")}
            >
              <span className={styles.message}>{n.message}</span>
              <span className={styles.dismissButton} onClick={dismissToastr}>
                &#x2716;
              </span>
            </div>
          );
        })}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Toastr);
