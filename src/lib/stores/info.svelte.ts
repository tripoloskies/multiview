import { sendPersistCommand } from "$lib/bun/wsApi.svelte";
import type { streamInstanceWithStatus } from "$websocket/api/listActiveStream";
import type { controlApiPathsList } from "$external/types/mediamtx";

export type infoType = {
  paths: controlApiPathsList[];
  instances: streamInstanceWithStatus[];
  isServerActive: boolean;
  serverTime: string;
};
export const info: infoType = $state({
  paths: [],
  instances: [],
  isServerActive: false,
  serverTime: "00:00:00.000000",
});

export function talkStart(): string {
  return sendPersistCommand({
    cmdName: "talk",
    data: {},
    callback: function ({ success }) {
      info.isServerActive = success;
    },
  });
}

export function infoStart(): string {
  return sendPersistCommand({
    cmdName: "realtimeInfo",
    data: {},
    callback: function ({ success, data }) {
      if (!success) {
        return;
      }

      if (!data?.paths || !data?.instances) {
        return;
      }

      const paths = data.paths as controlApiPathsList[];
      const instances = data.instances as streamInstanceWithStatus[];

      info.serverTime = String(data?.serverTime || "00:00:00.000000");
      info.paths = [...paths];
      info.instances.length = 0;
      info.instances = [...instances];
    },
  });
}
