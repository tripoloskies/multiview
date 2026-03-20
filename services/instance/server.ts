import z from 'zod';

const _server = Bun.serve({
	port: 8080,
	routes: {
		'/log': async (request, server) => {
			server.timeout(request, 0);
			const url = new URL(request.url);

			const data = {
				path: url.searchParams.get('path')
			};

			const schema = z.object({
				path: z.string().min(1)
			});

			const result = await schema.safeParseAsync(data);

			if (!result.success) {
				return new Response('Bad Reqeust', {
					status: 400,
					headers: {
						'Cache-Control': 'no-cache'
					}
				});
			}

			const newData = result.data;

			const process = Bun.spawn(
				[
					'bun',
					'cross-env',
					'PM2_HOME=./.pm2',
					'pm2',
					'logs',
					newData.path,
					'--raw',
					'--lines',
					'0'
				],
				{
					stdout: 'pipe',
					stderr: 'pipe'
				}
			);

			const stream = new ReadableStream({
				async start(controller) {
					const decoder = new TextDecoder();

					async function streamSource(readable: ReadableStream) {
						const reader = readable.getReader();
						let buffer: string = '';

						console.log(
							`[Instance Event] Instance Log for "${newData.path}" started.`
						);

						try {
							while (true) {
								const { done, value } = await reader.read();

								if (done) break;

								buffer += decoder.decode(value, { stream: true });
								const lines = buffer.split(/\r?\n/);
								buffer = lines.pop() || '';
								for (const line of lines) {
									// Send logs as they arrive
									controller.enqueue(`data: ${line}\n\n`);
								}
							}

							if (buffer) controller.enqueue(`data: ${buffer}\n\n`);
						} catch {
							console.warn(
								'[Instance Event] Controller suddenly stops. Ignoring...'
							);
						} finally {
							console.warn('[Instance Event] Logging done.');
						}
					}
					// Run both streams concurrently.
					const stdoutStream = streamSource(process.stdout);
					const stderrStream = streamSource(process.stderr);

					// Just kill the process if finished.
					Promise.all([stdoutStream, stderrStream]).finally(() => {
						if (!process.killed) {
							process.kill();
							console.log(
								`[Instance Event] Process ${process.pid} killed: ${process.exitCode}`
							);
						}
					});
				},
				cancel() {
					process.kill();
					console.log(
						`[Instance Event] Process ${process.pid} killed: ${process.exitCode}`
					);
				}
			});

			return new Response(stream, {
				headers: {
					'Content-Type': 'text/event-stream',
					Connection: 'keep-alive',
					'Cache-Control': 'no-cache',
					'X-Accel-Buffering': 'no'
				}
			});
		}
	}
});

console.log(
	`Instance Service Events: Listening ${_server.hostname}:${_server.port}`
);
