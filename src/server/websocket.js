import z from "zod";
import { actions as talk } from "$server/streams/api/talk";
import { actions as addStream } from "$server/streams/api/addStream";
import { actions as deleteStream } from "$server/streams/api/deleteStream";
import { actions as getServerTime } from "$server/streams/api/getServerTime";
import { actions as inspectStream } from "$server/streams/api/inspectStream";
import { actions as listActiveStream } from "$server/streams/api/listActiveStream";
import { actions as realtimeInfo } from "$server/streams/api/realtimeInfo";
import { actions as getStream } from "$server/streams/api/getStream";

const lists = [
  { cmdName: "talk", fn: talk },
  { cmdName: "addStream", fn: addStream },
  { cmdName: "deleteStream", fn: deleteStream },
  { cmdName: "inspectStream", fn: inspectStream },
  { cmdName: "getServerTime", fn: getServerTime },
  { cmdName: "listActiveStream", fn: listActiveStream },
  { cmdName: "realtimeInfo", fn: realtimeInfo },
  { cmdName: "getStream", fn: getStream },
];

const PERSIST_RATE_LIMIT = 10;
const PERSIST_REFRESH_DURATION = 500;
/**
 * @type {import("bun").WebSocketHandler<undefined>}
 */

export const sockets = {
  open(ws) {
    ws.sendText(
      JSON.stringify({
        success: true,
        message: "Welcome to the portal. ",
      }),
    );
  },

  // this is called when a message is received
  async message(ws, message) {
    let transactionId = "";
    /**
     * @param {string} transactionId
     * @param {{
     *  success: boolean,
     *  message: string,
     *  finished?: boolean,
     *  data?: {}
     * }} data
     */
    const send = (transactionId, data) => {
      let lData = {
        ...data,
        transactionId: transactionId,
      };
      ws.sendText(JSON.stringify(lData));
    };

    // Prevents other message from sending junk to here.
    if (typeof message !== "string") {
      send(transactionId, {
        success: false,
        message: "Invalid data format. Use JSON.",
      });
      return;
    }

    /**
     * @type {{
     *  success: boolean,
     *  message: string,
     *  transactionId: string | null,
     *  data: {} | null
     * }}
     */
    let data = JSON.parse(message);

    const schema = z.object({
      cmdName: z.string().min(1),
      transactionId: z.string().min(6),
      persist: z.boolean(),
      finished: z.boolean().optional(),
      data: z.record(z.string(), z.any()),
    });

    transactionId = data?.transactionId || "";

    try {
      let newData = await schema.parseAsync(data);
      transactionId = newData.transactionId;

      for (const list of lists) {
        if (list.cmdName != newData.cmdName) {
          continue;
        }
        if (newData.persist) {
          for (let x = 1; x <= PERSIST_RATE_LIMIT; x++) {
            let _data = {
              ...(await list.fn(newData.data)),
              finished: x == PERSIST_RATE_LIMIT,
            };
            send(transactionId, _data);
            await new Promise((resolve) =>
              setTimeout(() => resolve(true), PERSIST_REFRESH_DURATION),
            );
          }
        } else {
          send(transactionId, await list.fn(newData.data));
        }
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        let items = [];
        for (const issue of e.issues) {
          items.push(...issue.path);
        }
        send(transactionId, { success: false, message: "Incomplete details" });
        return;
      }

      throw e;
    }
  },
};
