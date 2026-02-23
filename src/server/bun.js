import { routes } from "./httpRoute";
import { sockets } from "./websocket";

const _server = Bun.serve({
  fetch(req, server) {
    const cookies = req.headers.get("cookie");

    if (!cookies?.length) {
      return new Response("Request not allowed!");
    }
    //
    const success = server.upgrade(req);
    if (success) return undefined;

    // Inform user that invalid request is not allowed.
    return new Response("Request not allowed!");
  },

  routes: routes,
  websocket: sockets,
});

console.log(`Listening deez this oss ${_server.hostname}:${_server.port}`);
