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

  port: 3000,
  routes: routes,
  websocket: sockets,
});

// clearJunk();
console.log(`Listening deez nuts ${_server.hostname}:${_server.port}`);
