import {
  deleteStoppedInstances,
  listStreamInstance,
  type streamInstance,
} from "$server/streams/console";
import { prisma } from "$server/prisma";
import type { wsActions } from "$server/websocket";
import type { controlApiPathsResponse } from "$server/types/external/mediamtx";

export type streamInstanceWithStatus = streamInstance & {
  status: string;
};

export const actions: wsActions = async () => {
  try {
    const request: Response = await fetch(
      `http://${Bun.env.MEDIAMTX_HOST}:9997/v3/paths/list`,
    );

    if (request.status !== 200) {
      return {
        success: false,
        message: "MediaMTX server is not alive.",
      };
    }

    const listData: controlApiPathsResponse =
      (await request.json()) as controlApiPathsResponse;
    const pm2InstanceLists: streamInstance[] = await listStreamInstance();
    await deleteStoppedInstances();

    const instanceLists: streamInstanceWithStatus[] = [];

    for (const list of pm2InstanceLists) {
      const activeStreamsData = await prisma.activeStreams.findFirst({
        select: {
          status: true,
        },
        where: {
          creatorName: list.name,
        },
      });

      instanceLists.push({
        ...list,
        status: activeStreamsData ? activeStreamsData?.status : "No Report",
      });
    }
    return {
      success: true,
      message: "OK",
      data: {
        paths: listData?.items || [],
        instances: instanceLists,
      },
    };
  } catch {
    return {
      success: false,
      message: "Not OK",
    };
  }
};
