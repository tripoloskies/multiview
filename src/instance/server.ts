import z from "zod";
import { prisma } from "$database/client";

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
    "/api/instance/logs": {
      GET: async (request) => {
        let stream: ReadableStream<unknown>;
        const url = new URL(request.url);
        const data = {
          path: url.searchParams.get("path"),
        };
        const schema = z.object({
          path: z.string().min(1),
        });

        try {
          const newData = await schema.parseAsync(data);

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

          request.signal.addEventListener("abort", () => {
            process.kill();
          });

          stream = new ReadableStream({
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
                } finally {
                  console.log("Logging done.");
                }
              }

              try {
                // Run both streams concurrently
                // We don't 'await' them here so they run in the background
                const stdoutStream = streamSource(process.stdout);
                const stderrStream = streamSource(process.stderr);

                // Wait for both to finish, then close the controller
                Promise.all([stdoutStream, stderrStream]).finally(() => {
                  process.kill();
                  controller.close();
                });
              } finally {
                console.log("Done for the day.");
              }
            },
            cancel() {
              process.kill();
            },
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            },
          });
        } catch {
          console.log("Oops");
        }

        return new Response(null, { status: 500 });
      },
    },
  },
});

console.log(`Websocket Server: Listening ${_server.hostname}:${_server.port}`);
