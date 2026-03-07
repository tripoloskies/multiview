import z from "zod";
import { prisma } from "$database/client";
import { getCORSValues } from "$lib/utils/browser";

const _server = Bun.serve({
  port: 3001,
  routes: {
    "/api/instance/inform": {
      POST: async (request: Bun.BunRequest) => {
        const data = Object.fromEntries((await request.formData()).entries());
        const schema = z.object({
          id: z.string().min(1),
          action: z.enum(["Update", "Delete"]),
          status: z.string().min(1),
        });

        try {
          const newData = await schema.parseAsync(data);

          switch (newData.action) {
            case "Update":
              await prisma.activeStreams.upsert({
                where: {
                  creatorName: newData.id,
                },
                update: {
                  status: newData.status,
                },
                create: {
                  creator: {
                    connectOrCreate: {
                      where: {
                        name: newData.id,
                      },
                      create: {
                        name: newData.id,
                      },
                    },
                  },
                  status: newData.status,
                },
              });
              break;
            case "Delete":
              await prisma.activeStreams.deleteMany({
                where: {
                  creatorName: newData.id,
                },
              });
              break;
            default:
              return new Response("-2");
          }
          return new Response("1");
        } catch (error) {
          if (error instanceof z.ZodError) {
            return new Response("-1");
          } else {
            return new Response("-3");
          }
        }
      },
    },
  },
});

const _serverSSE = Bun.serve({
  port: 8080,
  hostname: Bun.env.HOST,
  routes: {
    "/events/log": async (request, server) => {
      let newData: { path: string };
      const url = new URL(request.url);

      const data = {
        path: url.searchParams.get("path"),
      };
      const schema = z.object({
        path: z.string().min(1),
      });

      try {
        newData = await schema.parseAsync(data);
      } catch {
        return new Response(null, { status: 500 });
      }

      const process = Bun.spawn(
        [
          "bun",
          "cross-env",
          "PM2_HOME=./.pm2",
          "pm2",
          "logs",
          newData.path,
          "--raw",
          "--lines",
          "0",
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );

      const stream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();

          async function streamSource(readable: ReadableStream) {
            const reader = readable.getReader();
            let buffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || "";
                for (const line of lines) {
                  // Send logs as they arrive
                  controller.enqueue(`data: ${line}\n\n`);
                }
              }
              if (buffer) controller.enqueue(`data: ${buffer}\n\n`);
            } catch {
              console.log("Controller suddenly stops. Ignoring...");
            } finally {
              console.log("Logging done.");
            }
          }
          // Run both streams concurrently.
          const stdoutStream = streamSource(process.stdout);
          const stderrStream = streamSource(process.stderr);

          // Just kill the process if finished.
          Promise.all([stdoutStream, stderrStream]).finally(() => {
            if (!process.killed) {
              process.kill();
            }
          });
        },
        cancel() {
          process.kill();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": getCORSValues(),
          "X-Accel-Buffering": "no",
        },
      });
    },
  },
});

console.log(
  `Instance Server SSE: Listening ${_serverSSE.hostname}:${_serverSSE.port}`,
);
console.log(
  `Instance Server API: Listening ${_server.hostname}:${_server.port}`,
);
