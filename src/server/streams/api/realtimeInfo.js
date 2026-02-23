import { actions as talk } from "./talk";
import { actions as getServerTime } from "./getServerTime";
import { actions as listActiveStream } from "./listActiveStream";
/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
// eslint-disable-next-line no-unused-vars
export const actions = async (data) => {
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
