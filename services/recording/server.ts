import { Glob } from 'bun';
import { dirname } from 'node:path';
import { SEGMENT_TS_REGEX } from '@shared/utils/regex';
import z from 'zod';
import { prisma } from '@shared/database';
import { JSONResponse } from '@shared/utils/api';
import { rm } from 'node:fs/promises';

const _server = Bun.serve({
	port: 3003,
	routes: {
		'/delete/:id': {
			POST: async (request: Bun.BunRequest) => {
				const data = { ...request.params };
				const schema = z.object({
					id: z.string().min(1)
				});

				try {
					const newData = await schema.parse(data);

					const record = await prisma.record.findFirst({
						where: {
							id: newData.id
						}
					});

					if (!record) {
						console.error(
							`[Recordings Internal][/delete/video/:id]: Record id "${newData.id}" not found.`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Record not found'
						});
					}

					const fullManifestPath: string = `${Bun.env.RECORD_PATH}/${record.manifestPath}`;

					await prisma.record.deleteMany({
						where: {
							id: {
								in: [newData.id]
							}
						}
					});
					await rm(fullManifestPath, {
						force: true,
						recursive: true
					});

					return JSONResponse(null, {
						success: true,
						message: `Record ID "${newData.id}" deleted successfully.`
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(
							`[Recordings Internal][/delete/video/:id]: Invalid data. Missing fields (${items.join(', ')})`
						);
						return JSONResponse(null, {
							success: false,
							message: `Please complete the fields. ${items.join(', ')}`
						});
					}
					console.error(error);
					return JSONResponse(null, {
						success: false,
						message: 'Internal Server Error.'
					});
				}
			}
		},
		'/fetch/:id/:filename': {
			GET: async (request: Bun.BunRequest) => {
				let fp: Bun.BunFile;

				const responseHeaders = new Headers();
				const data = { ...request.params };

				const fileLists = new Glob(
					`${Bun.env.RECORD_PATH}/**/${data.id}/index.m3u8`
				);

				let path: string = '';

				for await (const file of fileLists.scan('.')) {
					path = dirname(file);
					break;
				}

				if (SEGMENT_TS_REGEX.test(data?.filename || '')) {
					fp = Bun.file(`${path}/segments/${data.filename}`);
					responseHeaders.set('Content-Type', 'video/m2ts');
				} else if (data.filename === 'index.m3u8') {
					await Bun.sleep(100);
					fp = Bun.file(`${path}/${data.filename}`);
					responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
				} else if (data.filename === 'thumbnail.jpg') {
					fp = Bun.file(`${path}/${data.filename}`);
					responseHeaders.set('Content-Type', 'image/jpg');
				} else {
					console.error(
						`[Recordings][fetch/:id/:filename]: Filename "${data.filename}" from Record ID "${data.id}" not found.`
					);
					return new Response(null, { status: 404 });
				}

				if (!(await fp.exists())) {
					console.error(
						`[Recordings][fetch/:id/:filename]: Filename "${data.filename}" from Record ID "${data.id}" not found.`
					);
					return new Response(null, { status: 404 });
				}

				return new Response(fp, {
					headers: responseHeaders
				});
			}
		}
	}
});

console.log(
	`Recording Service API: Listening ${_server.hostname}:${_server.port}`
);
