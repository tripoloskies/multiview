import z from "zod";
import { actions as talk } from "./api/talk";
import { actions as addStream } from "./api/addStream";
import { actions as deleteStream } from "./api/deleteStream";
import { actions as getServerTime } from "./api/getServerTime";
import { actions as inspectStream } from "./api/inspectStream";
import { actions as listActiveStream } from "./api/listActiveStream";
import { actions as realtimeInfo } from "./api/realtimeInfo";
import { actions as getStream } from "./api/getStream";
import type { apiResponse } from "./api/types";

export type wsMessageRequest = {
  cmdName: string;
  transactionId: string;
  persist: boolean;
  finished?: boolean;
  data: Record<string, unknown>;
};

export type wsMessageResponse = {
  success: boolean;
  message: string;
  finished?: boolean;
  transactionId: string;
  data?: Record<string, unknown>;
};

export type wsActions = (
  data?: Record<string, unknown>,
) => Promise<apiResponse>;

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

const PERSIST_RATE_LIMIT: number = 10;
const PERSIST_REFRESH_DURATION: number = 500;

export const sockets: Bun.WebSocketHandler<undefined> = {
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
    let transactionId: string = "";
    const send = (data: wsMessageResponse) => {
      ws.sendText(JSON.stringify(data));
    };

    // Prevents other message from sending junk to here.
    if (typeof message !== "string") {
      send({
        success: false,
        message: "Invalid data format. Use JSON.",
        transactionId: transactionId,
      });
      return;
    }

    const data: wsMessageRequest = JSON.parse(message);

    const schema = z.object({
      cmdName: z.string().min(1),
      transactionId: z.string().min(6),
      persist: z.boolean(),
      finished: z.boolean().optional(),
      data: z.record(z.string(), z.any()),
    });

    transactionId = data?.transactionId || "";

    try {
      const newData = await schema.parseAsync(data);
      transactionId = newData.transactionId;

      for (const list of lists) {
        if (list.cmdName != newData.cmdName) {
          continue;
        }
        if (newData.persist) {
          for (let x = 1; x <= PERSIST_RATE_LIMIT; x++) {
            const _data = {
              ...(await list.fn(newData.data)),
              finished: x == PERSIST_RATE_LIMIT,
            };
            send({
              ..._data,
              transactionId: transactionId,
            });
            await Bun.sleep(PERSIST_REFRESH_DURATION);
          }
        } else {
          send({
            ...(await list.fn(newData.data)),
            transactionId: transactionId,
          });
        }
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        const items = [];
        for (const issue of e.issues) {
          items.push(...issue.path);
        }
        send({
          success: false,
          transactionId: transactionId,
          message: "Incomplete details",
        });
        return;
      }

      throw e;
    }
  },
};
