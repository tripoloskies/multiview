import { routes } from "./httpRoute";
import { prisma } from "./prisma";
import { sockets } from "./websocket";

async function clearJunk() {
  while (true) {
    /**
     * @type {string[]}
     */
    let listOfDeleteIds = [];
    let lists = await prisma.vodProps.findMany({
      select: {
        id: true,
        manifestPath: true,
      },
    });

    for (const { id, manifestPath } of lists) {
      if (
        !(await Bun.file(
          `/mnt/record-storage/${manifestPath}/index.mp4`,
        ).exists())
      ) {
        listOfDeleteIds.push(id);
        console.log("detected trash: ", id);
      }
    }

    if (listOfDeleteIds.length) {
      for (const id of listOfDeleteIds) {
        try {
          await prisma.vodProps.delete({
            where: {
              id: id,
            },
          });
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          // ignore
        }
      }
    }
    await new Promise((resolve) =>
      setTimeout(
        () => {
          console.log("Renewed once again. ");
          resolve("Renewed");
        },
        1000 * 60 * 10,
      ),
    );
  }
}
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

clearJunk();
console.log(`Listening deez nuts ${_server.hostname}:${_server.port}`);
