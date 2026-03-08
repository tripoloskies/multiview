import type { wsActions } from "$websocket/websocket";

export const actions: wsActions = async () => {
  try {
    const request = await fetch(`http://${Bun.env.MEDIAMTX_HOST}:9997/v3/info`);
    if (request.status !== 200) {
      return {
        success: false,
        message: "MediaMTX server is not alive.",
      };
    }
    return {
      success: true,
      message: "MediaMTX server is alive.",
    };
  } catch {
    return {
      success: false,
      message: "MediaMTX server is not alive.",
    };
  }
};
