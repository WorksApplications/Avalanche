import { ThunkActionCreator, thunkToAction } from "typescript-fsa-redux-thunk";

export type OperationToProp<T> = T extends {
  action: ThunkActionCreator<
    infer Params,
    Promise<infer Succ>,
    infer State,
    infer Extra
  >;
}
  ? (params?: Params) => Promise<Succ>
  : never;

export type OperationsToProps<T> = { [P in keyof T]: OperationToProp<T[P]> };

export function thunkToActionBulk(thunks: {
  [key: string]: { action: ThunkActionCreator<any, any, any, any> };
}): { [key: string]: any } {
  const result = {};
  for (const [key, thunk] of Object.entries(thunks)) {
    result[key] = thunkToAction(thunk.action);
  }
  return result;
}
