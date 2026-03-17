import z from 'zod';
import { prisma } from '@shared/database';

const _server = Bun.serve({
	port: 3001,
	routes: {
		'/inform': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					path: z.string().min(1),
					action: z.enum(['Update', 'Delete']),
					status: z.string().min(1)
				});

				const result = await schema.safeParseAsync(data);

				if (!result.success) {
					return new Response('1');
				}

				const newData = result.data;

				switch (newData.action) {
					case 'Update':
						await prisma.activeStreams.upsert({
							where: {
								creatorName: newData.path
							},
							update: {
								status: newData.status
							},
							create: {
								creator: {
									connectOrCreate: {
										where: {
											name: newData.path
										},
										create: {
											name: newData.path
										}
									}
								},
								status: newData.status
							}
						});
						break;
					case 'Delete':
						await prisma.activeStreams.deleteMany({
							where: {
								creatorName: newData.path
							}
						});
						break;
					default:
						return new Response('2');
				}
				return new Response('0');
			}
		}
	}
});

console.log(`Instance Internal Service API: Listening ${_server.hostname}:${_server.port}`);
