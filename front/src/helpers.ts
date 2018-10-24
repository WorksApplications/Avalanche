import { Dispatch } from "redux";
import { Meta } from "typescript-fsa";

// export type DispatchPropWithInference<T> = T extends (() => (
//   dispatch: Dispatch
// ) => infer R)
//   ? () => R
//   : T extends ((arg1: infer A1) => (dispatch: Dispatch) => infer R)
//     ? (arg1: A1) => R
//     : T extends (() => infer R) // not thunk below
//       ? () => R
//       : T extends ((arg1: infer A1) => infer R) ? (arg1: A1) => R : undefined;

export type DispatchPropWithInference<T> = T extends (() => (
  dispatch: Dispatch
) => infer R)
  ? () => R
  : T extends ((
      payload: infer P,
      meta?: Meta
    ) => (dispatch: Dispatch) => infer R)
    ? (payload: P, meta?: Meta) => R
    : T; // not thunk below

export type DispatchPropList<T> = {
  [P in keyof T]: DispatchPropWithInference<T[P]>
};
