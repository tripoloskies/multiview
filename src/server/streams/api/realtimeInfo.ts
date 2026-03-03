import { actions as talk } from "./talk";
import { actions as getServerTime } from "./getServerTime";
import { actions as listActiveStream } from "./listActiveStream";
import type { wsActions } from "$server/websocket";

export const actions: wsActions = async () => {
  const talkRes = await talk({});

  if (!talkRes.success) {
    return {
      success: false,
      message: talkRes.message,
    };
  }

  const timeRes = await getServerTime({});
  const streamRes = await listActiveStream({});
  return {
    success: true,
    message: talkRes.message,
    data: {
      ...timeRes?.data,
      ...streamRes?.data,
    },
  };
};
