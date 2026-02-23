import { SvelteMap } from "svelte/reactivity";
import { v4 as uuidv4 } from "uuid";

/**
 * @type {SvelteMap<string, {cmdName: string, data: {}, callback: function({success: boolean, message: string, data?: Record<string, any>}): void}>}
 */
let persistIds = new SvelteMap();

/**
 * @type {WebSocket}
 */
let socket;

/**
 * @type {NodeJS.Timeout}
 */
let timeoutId;

/**
 *
 * @param {string} hostUri
 */
export function start(hostUri) {
  socket = new WebSocket(`ws://${hostUri}`);

  socket.onopen = () => {
    clearTimeout(timeoutId);
    for (const [key, data] of persistIds) {
      _sendCommand(data.cmdName, data.data, key, true);
    }
  };

  socket.onmessage = async (message) => {
    for (const [transactionId, props] of persistIds) {
      /**
       * @type {{
       *  success: boolean,
       *  message: string,
       *  finished: boolean,
       *  transactionId: string | null,
       *  data?: {}
       * }}
       */
      let data = JSON.parse(message.data);
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

function isReady() {
  return new Promise((resolve) => {
    let x = setInterval(() => {
      if (socket.readyState == socket.OPEN) {
        clearInterval(x);
        resolve(true);
      }
    }, 100);
  });
}

/**
 *
 * @param {string} cmdName
 * @param {{}} data
 * @param {string} transactionId
 * @param {boolean} persist
 * @return {Promise<{
 *  success: boolean,
 *  message: string,
 *  data?: Record<string, any>
 * }>}
 */
async function _sendCommand(cmdName, data, transactionId, persist = false) {
  await isReady();
  return new Promise((resolve) => {
    /**
     * @this {WebSocket}
     * @param {MessageEvent<any>} event - The message event containing the received data.
     * @returns {void}
     */
    function func(event) {
      /**
       * @type {{
       *  success: boolean,
       *  message: string,
       *  transactionId: string | null,
       *  data?: {}
       * }}
       */
      const result = JSON.parse(event.data);
      const resultTransactionId = result?.transactionId;
      if (
        !result?.transactionId?.length ||
        resultTransactionId != transactionId
      ) {
        return;
      }

      this.removeEventListener("message", func);

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
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      console.warn("I don't care, just continue.");
    }
  });
}

/**
 *
 * @param {string} cmdName
 * @param {{}} data
 * @return {Promise<{
 *  success: boolean,
 *  message: string,
 *  data?: Record<string, any>
 * }>}
 */
export function sendCommand(cmdName, data = {}) {
  let transactionId = uuidv4();
  return _sendCommand(cmdName, data, transactionId);
}
/**
 *
 * @param {string} cmdName
 * @param {{}} data
 * @param {function({success: boolean, message: string, data?: Record<string, any>}): void} callback
 * @return {string}
 */
export function sendPersistCommand(cmdName, data = {}, callback) {
  let transactionId = uuidv4();
  persistIds.set(transactionId, {
    cmdName: cmdName,
    data: data,
    callback: callback,
  });
  _sendCommand(cmdName, data, transactionId, true);

  return transactionId;
}

/**
 * @param {string} transactionId
 */
export function removePersistCommand(transactionId) {
  persistIds.delete(transactionId);
}
