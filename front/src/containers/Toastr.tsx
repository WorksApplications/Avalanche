import { Component, FunctionalComponent, h } from "preact";
import { connect } from "preact-redux";
import { bindActionCreators, Dispatch } from "redux";
import { hideToastr } from "../actions";
import { IApplicationState } from "../store";
// @ts-ignore
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
  isShown: state.isToastrShown,
  message: state.toastrMessage,
  kind: state.toastrKind,
  id: state.toastrId
});

const mapDispatchToProps: (dispatch: Dispatch) => IDispatchProps = dispatch =>
  bindActionCreators(
    {
      hideToastr
    },
    dispatch
  );

// @ts-ignore
@connect(
  mapStateToProps,
  mapDispatchToProps
)
class Toastr extends Component<IStateProps & IDispatchProps> {
  public render() {
    const dismissToastr = () =>
      this.props.hideToastr({ id: this.props.id || 0 });
    return this.props.message != null ? (
      <div
        className={[
          styles.wrap,
          this.props.isShown ? styles.shown : styles.hidden,
          this.props.kind === "success"
            ? styles.success
            : this.props.kind === "error"
              ? styles.error
              : undefined
        ].join(" ")}
      >
        {this.props.message}
        <span className={styles.dismissButton} onMouseDown={dismissToastr}>
          &#x2716;
        </span>
      </div>
    ) : (
      <div />
    );
  }
}

export default (Toastr as any) as FunctionalComponent;
