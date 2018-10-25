import { ThunkActionCreator, thunkToAction } from "typescript-fsa-redux-thunk";

// export type OperationToProp<T> = T extends (() => (
//   dispatch: Dispatch
// ) => infer R)
//   ? () => R
//   : T extends ((arg1: infer A1) => (dispatch: Dispatch) => infer R)
//     ? (arg1: A1) => R
//     : T extends (() => infer R) // not thunk below
//       ? () => R
//       : T extends ((arg1: infer A1) => infer R) ? (arg1: A1) => R : undefined;

// export type OperationToProp<T> = T extends (() => (dispatch: Dispatch) => infer R)
//   ? () => R
//   : T extends ((
//       payload: infer P,
//       meta?: Meta
//     ) => (dispatch: Dispatch) => infer R)
//     ? (payload: P, meta?: Meta) => R
//     : T; // not thunk below
//
// export type OperationToProps<T> = { [P in keyof T]: OperationToProp<T[P]> };

export type OperationToProp<T> = T extends {
  action: ThunkActionCreator<
    infer Params,
    Promise<infer Succ>,
    infer State,
    infer Extra
  >;
} // ? ThunkActionCreator<Params, Promise<Succ>, State, Extra> // ? (params?: Params) => ThunkAction<Promise<Succ>, State, Extra, AnyAction>
  ? (params?: Params) => Promise<Succ>
  : never;

export type OperationToProps<T> = { [P in keyof T]: OperationToProp<T[P]> };

export function thunkToActionBulk(thunks: {
  [key: string]: { action: ThunkActionCreator<any, any, any, any> };
}): { [key: string]: any } {
  const result = {};
  for (const [key, thunk] of Object.entries(thunks)) {
    result[key] = thunkToAction(thunk.action);
  }
  return result;
}
