import { Dispatch } from "redux";
import actionCreatorFactory, { Meta } from "typescript-fsa";
import { COLLECT_API_BASE } from "../constants";
import * as collect from "../generated/collect/api";
import { IEnvironmentInfo, IPodInfo, ISnapshotInfo } from "../store";

const actionCreator = actionCreatorFactory();

const collectClient = collect.DefaultApiFactory(
  {},
  undefined,
  COLLECT_API_BASE
);

function environmentInfoConvert(env: collect.Environment): IEnvironmentInfo {
  return {
    id: env.id,
    name: env.name,
    pods: (env.pods || []).map<IPodInfo>(p => podInfoConvert(p)),
    liveCount: env.liveCount
  };
}

function podInfoConvert(pod: collect.Pod): IPodInfo {
  const created = new Date(pod.createdAt ? pod.createdAt : 0);
  return {
    id: pod.id,
    name: pod.name,
    isAlive: pod.isAlive,
    createdAt: created,
    app: pod.app,
    env: pod.environment,
    snapshots: (pod.snapshots || []).map(s => snapshotInfoConvert(s))
  };
}

function snapshotInfoConvert(snapshot: collect.Snapshot): ISnapshotInfo {
  const created = new Date(snapshot.createdAt ? snapshot.createdAt : 0);
  return {
    uuid: snapshot.uuid,
    name: undefined,
    pod: snapshot.pod,
    environment: snapshot.environment,
    createdAt: created,
    link: snapshot.flamescopeLink
  };
}

export const selectApp = actionCreator<{ appName: string }>("SELECT_APP");

export const selectEnv = actionCreator<{ envName: string | null }>(
  "SELECT_ENV"
);

export const selectPod = actionCreator<{ podName: string | null }>(
  "SELECT_POD"
);

export const getAppsAsyncAction = actionCreator.async<
  {},
  { apps: string[] },
  { message: string }
>("GET_APPS");

export const getApps = (meta?: Meta) => (
  dispatch: Dispatch
): Promise<{ apps: string[] }> => {
  const params = {};
  dispatch(getAppsAsyncAction.started(params, meta));
  return collectClient
    .getApps()
    .then((apps: string[]) => {
      const result = { apps };
      dispatch(getAppsAsyncAction.done({ params, result }, meta));
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        getAppsAsyncAction.failed(
          {
            params,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};

export const getEnvironmentsOfAppAsyncAction = actionCreator.async<
  { app: string },
  { envs: IEnvironmentInfo[] },
  { message: string }
>("GET_ENVS_OF_APP");

export const getEnvironmentsOfApp = (params: { app: string }, meta?: Meta) => (
  dispatch: Dispatch
): Promise<{ envs: IEnvironmentInfo[] }> => {
  dispatch(getEnvironmentsOfAppAsyncAction.started(params, meta));
  return collectClient
    .getEnvironments(params.app)
    .then((envResults: collect.Environment[]) => {
      const envs = envResults.map(env => environmentInfoConvert(env));
      const result = { envs };
      dispatch(getEnvironmentsOfAppAsyncAction.done({ params, result }, meta));
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        getEnvironmentsOfAppAsyncAction.failed(
          {
            params,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};

export const getRunningPodsAsyncAction = actionCreator.async<
  {},
  { pods: IPodInfo[] },
  { message: string }
>("GET_RUNNING_PODS");

export const getRunningPods = (meta?: Meta) => (
  dispatch: Dispatch
): Promise<{ pods: IPodInfo[] }> => {
  const params = {};
  dispatch(getRunningPodsAsyncAction.started(params, meta));
  return collectClient
    .listAvailablePods()
    .then((podResults: collect.Pod[]) => {
      const pods = podResults.map(pod => podInfoConvert(pod));
      const result = { pods };
      dispatch(getRunningPodsAsyncAction.done({ params, result }, meta));
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        getRunningPodsAsyncAction.failed(
          {
            params,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};

export const postSnapshotAsyncAction = actionCreator.async<
  {
    appId: string;
    environment: string;
    podId: string;
  },
  { newSnapshot: ISnapshotInfo },
  { message: string }
>("POST_NEW_SNAPSHOT");

export const postSnapshot = (
  params: {
    appId: string;
    environment: string;
    podId: string;
  },
  meta?: Meta
) => (dispatch: Dispatch): Promise<{ newSnapshot: ISnapshotInfo }> => {
  dispatch(postSnapshotAsyncAction.started(params, meta));
  return collectClient
    .newSnapshot(params.appId, params.environment, params.podId, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch"
    })
    .then((snapshot: collect.Snapshot) => {
      const newSnapshot = snapshotInfoConvert(snapshot);
      const result = { newSnapshot };
      dispatch(postSnapshotAsyncAction.done({ params, result }, meta));
      return result;
    })
    .catch((reason: Error) => {
      dispatch(
        postSnapshotAsyncAction.failed(
          {
            params,
            error: { message: reason.message }
          },
          meta
        )
      );
      throw reason;
    });
};
