import z from 'zod';
import { updateInstanceStatus } from './client';

const _server = Bun.serve({
	port: 3001,
	routes: {
		'/inform': {
			POST: async (request: Bun.BunRequest) => {
				const requestData = Object.fromEntries(
					(await request.formData()).entries()
				);
				const schema = z.object({
					path: z.string().min(1),
					action: z.enum(['Update', 'Delete']),
					status: z.string().min(1)
				});

				const { data, success } = await schema.safeParseAsync(requestData);

				if (!success) {
					return new Response('1');
				}

				if (
					!(await updateInstanceStatus(data.path, data.action, data.status))
				) {
					return new Response('2');
				}

				return new Response('0');
			}
		}
	}
});

console.log(
	`Instance Internal Service API: Listening ${_server.hostname}:${_server.port}`
);
