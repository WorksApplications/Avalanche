import { FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as actions from "../actions";
import { IApplicationState } from "../store";
// @ts-ignore
import styles from "./Toastr.scss";

const mapStateToProps = (state: IApplicationState) => ({
  isShown: state.isToastrShown,
  message: state.toastrMessage,
  kind: state.toastrKind
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      hideToastr: actions.hideToastr
    },
    dispatch
  );

// @ts-ignore
const Toastr: FunctionalComponent = ({
  isShown,
  message,
  kind = "success",
  hideToastr
}: {
  isShown: boolean;
  message: string;
  kind: "success" | "error";
  hideToastr: () => void;
}) => {
  return message != null ? (
    <div
      className={[
        styles.wrap,
        isShown ? styles.shown : styles.hidden,
        kind === "success"
          ? styles.success
          : kind === "error"
            ? styles.error
            : undefined
      ].join(" ")}
    >
      {message}
      {/*<span>&#x1F5D9;</span>*/}
      <span className={styles.dismissButton} onMouseDown={hideToastr}>
        &#x2716;
      </span>
    </div>
  ) : (
    <div />
  );
};
// @ts-ignore
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Toastr);
