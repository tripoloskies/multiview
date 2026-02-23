import { sendPersistCommand } from "$lib/bun/wsApi.svelte";

export let info = $state({
  /**
   * @type {Array<{
   *      name: string,
   *      confName: string,
   *      ready: boolean,
   *      readyTime: string,
   *      online: boolean,
   *      onlineTime: string
   *  }>}
   */
  paths: [],
  /**
   * @type {Array<{
   *      name: string,
   *      labelName: string,
   *      active: boolean,
   *      status: string
   *  }>}
   */
  instances: [],

  isServerActive: false,
  /** @type {string} */
  serverTime: "00:00:00.000000",
});

export function talkStart() {
  return sendPersistCommand("talk", {}, function ({ success }) {
    info.isServerActive = success;
  });
}

export function infoStart() {
  return sendPersistCommand("realtimeInfo", {}, function ({ success, data }) {
    if (!success) {
      return;
    }

    info.serverTime = String(data?.serverTime) || "00:00:00.000000";
    info.paths = [...(data?.paths ?? [])];
    info.instances.length = 0;
    info.instances = [...(data?.instances ?? [])];
  });
}
