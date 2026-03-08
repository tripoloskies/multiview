import { sockets } from "./websocket";

const _server = Bun.serve({
  fetch(request, server) {
    const cookies = request.headers.get("cookie");

    if (!cookies?.length) {
      return new Response("Request not allowed!");
    }

    const success = server.upgrade(request);

    if (success) return undefined;

    // Inform user that invalid request is not allowed.
    return new Response("Request not allowed!");
  },

  port: 3000,
  websocket: sockets,
});

console.log(`Websocket Server: Listening ${_server.hostname}:${_server.port}`);
