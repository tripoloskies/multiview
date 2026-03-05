import type { wsActions } from "$websocket/websocket";

export const actions: wsActions = async () => {
  const now: Date = new Date();
  const time: string =
    now.toTimeString().split(" ")[0] +
    "." +
    now.getMilliseconds().toString().padStart(3, "0");
  return {
    success: true,
    message: "OK",
    data: {
      serverTime: time,
    },
  };
};
