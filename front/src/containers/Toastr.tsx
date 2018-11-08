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
