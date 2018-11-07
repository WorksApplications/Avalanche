import { ThunkActionCreator, thunkToAction } from "typescript-fsa-redux-thunk";

export function operationsToActionCreators<
  T extends {
    [key: string]: { action: ThunkActionCreator<any, any, any, any> };
  }
>(
  thunks: T
): {
  [P in keyof T]: T[P]["action"] extends ThunkActionCreator<
    infer Params,
    infer Succ,
    any,
    any
  >
    ? ((params?: Params | undefined) => Succ)
    : never
};
export function operationsToActionCreators(thunks: {
  [key: string]: { action: any };
}) {
  const result = {};
  for (const [key, thunk] of Object.entries(thunks)) {
    result[key] = thunkToAction(thunk.action);
  }
  return result;
}
