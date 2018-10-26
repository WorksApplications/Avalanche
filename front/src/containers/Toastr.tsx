import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { hideToastr } from "../actions";
import { IApplicationState } from "../store";
import styles from "./Toastr.scss";

interface IStateProps {
  isShown: boolean;
  message: string | null;
  kind: "success" | "error";
  id: number | null;
}

interface IDispatchProps {
  hideToastr: typeof hideToastr;
}

const mapStateToProps: (state: IApplicationState) => IStateProps = state => ({
  isShown: state.toastNotification.isShown,
  message: state.toastNotification.message,
  kind: state.toastNotification.kind,
  id: state.toastNotification.id
});

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators(
    {
      hideToastr
    },
    dispatch
  );

export class Toastr extends React.Component<IStateProps & IDispatchProps> {
  public render() {
    const dismissToastr = () =>
      this.props.hideToastr({ id: this.props.id || 0 });
    return (
      <div
        className={[
          styles.wrap,
          this.props.isShown ? styles.shown : styles.hidden,
          this.props.message == null
            ? undefined
            : this.props.kind === "success"
              ? styles.success
              : this.props.kind === "error"
                ? styles.error
                : undefined
        ].join(" ")}
      >
        <span className={styles.message}>{this.props.message}</span>
        <span className={styles.dismissButton} onClick={dismissToastr}>
          &#x2716;
        </span>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Toastr) as React.ComponentClass;
