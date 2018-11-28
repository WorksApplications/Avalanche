import actionCreatorFactory from "typescript-fsa";
import { asyncFactory } from "typescript-fsa-redux-thunk";
import heatMapClient, { IHeatMap } from "../clients/heatMapClient";
import { COLLECT_API_BASE, SUSPECT_API_BASE } from "../constants";
import {
  DefaultApiFactory as collectApiFactory,
  Environment,
  Pod,
  Snapshot
} from "../generated/collect/api";
import {
  DefaultApiFactory as suspectApiFactory,
  Report
} from "../generated/suspect/api";
import { IEnvironmentInfo, IPodInfo, ISnapshotInfo } from "../store";

const actionCreator = actionCreatorFactory();
const asyncActionCreator = asyncFactory(actionCreator);

const collectClient = collectApiFactory({}, undefined, COLLECT_API_BASE);

const suspectClient = suspectApiFactory({}, undefined, SUSPECT_API_BASE);

function environmentInfoConvert(env: Environment): IEnvironmentInfo {
  return {
    id: env.id,
    name: env.name,
    pods: (env.pods || []).map<IPodInfo>(p => podInfoConvert(p)),
    liveCount: env.liveCount
  };
}

function podInfoConvert(pod: Pod): IPodInfo {
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

function snapshotInfoConvert(snapshot: Snapshot): ISnapshotInfo {
  const created = new Date(snapshot.createdAt ? snapshot.createdAt : 0);
  const tokens = snapshot.flamescopeLink!.split("/");
  const heatMapId = tokens[tokens.length - 1];

  return {
    uuid: snapshot.uuid,
    name: undefined,
    pod: snapshot.pod,
    environment: snapshot.environment,
    createdAt: created,
    link: snapshot.flamescopeLink!,
    heatMapId
  };
}

export interface IPerfCallTree {
  name: string;
  children: IPerfCallTree[];
}

function perfCallTreeConvert(report: Report): IPerfCallTree {
  return {
    name: report.name!,
    children: report.children ? report.children.map(perfCallTreeConvert) : []
  };
}

export const getAppsOperation = asyncActionCreator<{}, { apps: string[] }>(
  "GET_APPS",
  () =>
    collectClient.getApps().then((apps: string[]) => {
      return { apps };
    })
);

export const getEnvironmentsOfAppOperation = asyncActionCreator<
  { app: string },
  { envs: IEnvironmentInfo[] }
>("GET_ENVS_OF_APP", ({ app }) =>
  collectClient.getEnvironments(app).then((envResults: Environment[]) => {
    const envs = envResults.map(env => environmentInfoConvert(env));
    return { envs };
  })
);

export const getRunningPodsOperation = asyncActionCreator<
  {},
  { pods: IPodInfo[] }
>("GET_RUNNING_PODS", () =>
  collectClient.listAvailablePods().then((podResults: Pod[]) => {
    const pods = podResults.map(pod => podInfoConvert(pod));
    return { pods };
  })
);

export const postSnapshotOperation = asyncActionCreator<
  {
    appId: string;
    environment: string;
    podId: string;
  },
  { newSnapshot: ISnapshotInfo }
>("POST_NEW_SNAPSHOT", ({ appId, environment, podId }) =>
  collectClient
    .newSnapshot(appId, environment, podId, {
      headers: {
        "Content-Type": "application/json"
      } // This is due to "typescript-fetch"
    })
    .then((snapshot: Snapshot) => {
      const newSnapshot = snapshotInfoConvert(snapshot);
      return { newSnapshot };
    })
);

export const getLatestSnapshotsOperation = asyncActionCreator<
  { count: number },
  { snapshots: ISnapshotInfo[] }
>("GET_LATEST_SNAPSHOTS", ({ count }) =>
  collectClient.listSnapshots("date", count).then(snapshotResults => {
    const snapshots = snapshotResults.map(s => snapshotInfoConvert(s));
    return { snapshots };
  })
);

export const getHeatMapOperation = asyncActionCreator<
  { snapshotId: string; heatMapId: string },
  { heatMap: IHeatMap }
>("GET_HEAT_MAP", ({ heatMapId }) =>
  heatMapClient(heatMapId).then(result => {
    return { heatMap: result };
  })
);

export const getPerfCallTreeOperation = asyncActionCreator<
  { snapshotId: string; startPosition: number; endPosition: number },
  { tree: IPerfCallTree }
>("GET_PERF_CALL_TREE", ({ snapshotId, startPosition, endPosition }) =>
  suspectClient
    .reportsUuidGet(snapshotId, startPosition, endPosition)
    .then(result => {
      return { tree: perfCallTreeConvert(result) };
    })
);
