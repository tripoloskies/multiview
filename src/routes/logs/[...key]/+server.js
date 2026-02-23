// src/routes/api/run-script/+server.js

export function GET({ params, request }) {
  const process = Bun.spawn(
    [
      "bun",
      "cross-env",
      "PM2_HOME=./.pm2",
      "pm2",
      "logs",
      params.key,
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

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();

      // Helper to handle streaming from a specific source (stdout or stderr)
      /**
       *
       * @param {ReadableStream} readable
       */
      async function streamSource(readable) {
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
        } catch (e) {
          console.error("Source stream error:", e);
        }
      }

      // Run both streams concurrently
      // We don't 'await' them here so they run in the background
      const stdoutStream = streamSource(process.stdout);
      const stderrStream = streamSource(process.stderr);

      // Wait for both to finish, then close the controller
      Promise.all([stdoutStream, stderrStream]).finally(() => {
        process.kill();
        controller.close();
      });
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
}
