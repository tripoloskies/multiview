import { SvelteMap } from "svelte/reactivity";
import { v4 as uuidv4 } from "uuid";

export type wsApiResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export type wsApiResponse = {
  success: boolean;
  message: string;
  finished: boolean;
  transactionId?: string;
  data?: Record<string, unknown>;
};

export type wsApiPersistOptions = {
  cmdName: string;
  data: Record<string, unknown>;
  callback: (result: wsApiResult) => void;
};

const persistIds: SvelteMap<string, wsApiPersistOptions> = new SvelteMap();

let socket: WebSocket;

let timeoutId: NodeJS.Timeout;

export function start(hostUri: string): void {
  socket = new WebSocket(`ws://${hostUri}`);

  socket.onopen = () => {
    clearTimeout(timeoutId);
    for (const [key, data] of persistIds) {
      _sendCommand(data.cmdName, data.data, key, true);
    }
  };

  socket.onmessage = async (message) => {
    for (const [transactionId, props] of persistIds) {
      const data = JSON.parse(message.data) as wsApiResponse;
      if (transactionId !== data.transactionId) {
        continue;
      }
      props.callback({
        success: data.success,
        message: data.message,
        data: data?.data,
      });

      if (data.finished) {
        await _sendCommand(props.cmdName, props.data, transactionId, true);
      }
    }
  };

  socket.onerror = () => {
    console.error("Websocket client error detected! Restarting....");
    timeoutId = setTimeout(() => {
      start(hostUri);
    }, 500);
  };

  socket.onclose = () => {
    timeoutId = setTimeout(() => {
      start(hostUri);
    }, 500);
  };
}

function isReady(): Promise<true> {
  return new Promise((resolve) => {
    const x = setInterval(() => {
      if (socket.readyState == socket.OPEN) {
        clearInterval(x);
        resolve(true);
      }
    }, 100);
  });
}

async function _sendCommand(
  cmdName: string,
  data: Record<string, unknown>,
  transactionId: string,
  persist: boolean = false,
): Promise<wsApiResult> {
  await isReady();
  return new Promise((resolve) => {
    function func(event: MessageEvent) {
      const result: wsApiResponse = JSON.parse(event.data);
      const resultTransactionId = result?.transactionId;
      if (
        !result?.transactionId?.length ||
        resultTransactionId != transactionId
      ) {
        return;
      }

      socket.removeEventListener("message", func);

      resolve({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }

    try {
      if (!persist) {
        socket.addEventListener("message", func);
      }
      socket.send(
        JSON.stringify({
          cmdName: cmdName,
          persist: persist,
          transactionId: transactionId,
          data: data,
        }),
      );
    } catch {
      console.warn("I don't care, just continue.");
    }
  });
}

export function sendCommand(
  cmdName: string,
  data: Record<string, unknown>,
): Promise<wsApiResult> {
  const transactionId: string = uuidv4();
  return _sendCommand(cmdName, data, transactionId);
}

export function sendPersistCommand(options: wsApiPersistOptions): string {
  const transactionId: string = uuidv4();
  persistIds.set(transactionId, {
    cmdName: options.cmdName,
    data: options.data,
    callback: options.callback,
  });
  _sendCommand(options.cmdName, options.data, transactionId, true);

  return transactionId;
}

export function removePersistCommand(transactionId: string): void {
  persistIds.delete(transactionId);
}
