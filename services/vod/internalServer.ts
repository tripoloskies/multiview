import z from 'zod';
import { rm } from 'node:fs/promises';
import { prisma } from '@shared/database';
import { ytdlpMetadataSchema } from '@shared/schema/yt-dlp';
import { randomStringGenerator } from '@shared/utils/browser';
import { JSONResponse } from '@shared/utils/api';
import { vodGetSchema, vodListsSchema } from '@shared/schema/vod';

const _server = Bun.serve({
	port: 3002,
	routes: {
		'/list': {
			POST: async (request: Bun.BunRequest) => {
				const data = await request.json();
				const schema = z.object({
					page: z.number(),
					maxItems: z.number().optional().default(5)
				});

				try {
					const newData = await schema.parse(data);

					if (newData.page < 1) {
						console.error(
							`[VOD][/list]: Value of page must not lower than 1. Request data wants page=${newData.page}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of page must not lower than 1.'
						});
					}

					if (newData.maxItems < 1) {
						console.error(
							`[VOD][/list]: Value of Max Items must not lower than 1. Request data wants maxItems=${newData.maxItems}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of Max Items must not lower than 1.'
						});
					}

					const itemCount = await prisma.vodProps.count();
					const vodLists = await prisma.vodProps.findMany({
						select: {
							id: true,
							datePublished: true,
							creator: {
								select: {
									name: true
								}
							}
						},
						orderBy: {
							datePublished: 'desc'
						},
						take: newData.maxItems,
						skip: newData.maxItems * newData.page - newData.maxItems
					});

					console.log(`[VOD][/list]: Retrieved items: ${vodLists.length}`);

					return JSONResponse(vodListsSchema, {
						success: true,
						message: 'OK',
						data: {
							count: itemCount,
							lists: vodLists
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(`[VOD][/list]: Invalid data. Missing fields (${items.join(', ')})`);
						return JSONResponse(null, {
							success: false,
							message: `Please complete the fields. ${items.join(', ')}`
						});
					}

					console.error(error);
					return JSONResponse(null, {
						success: false,
						message: "There's a problem when deleting a stream instance."
					});
				}
			}
		},
		'/get/:id': {
			GET: async (request: Bun.BunRequest) => {
				const data = { ...request.params };
				const schema = z.object({
					id: z.string().min(1)
				});

				try {
					const newData = await schema.parse(data);

					const vodInfo = await prisma.vodProps.findFirst({
						where: {
							id: newData.id
						}
					});

					if (!vodInfo) {
						console.error(`[VOD][/get/:id]: VOD id "${newData.id}" not found.`);
						return JSONResponse(null, {
							success: false,
							message: 'VOD not found'
						});
					} else if (!vodInfo?.metadataId) {
						console.warn(`[VOD][/get/:id]: VOD id "${newData.id}" contains no metadata. Continue.`);
						return JSONResponse(vodGetSchema, {
							success: true,
							message: 'OK',
							data: {
								info: vodInfo,
								metadata: null
							}
						});
					}

					const vodMetadata = await prisma.vodMetadata.findFirst({
						where: {
							streamId: vodInfo.metadataId
						}
					});

					console.log(`[VOD][/get/:id]: VOD id "${newData.id}" contains metadata. Continue.`);
					return JSONResponse(vodGetSchema, {
						success: true,
						message: 'OK',
						data: {
							info: vodInfo,
							metadata: vodMetadata
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(`[VOD][/get/:id]: Invalid data. Missing fields (${items.join(', ')})`);
						return JSONResponse(null, {
							success: false,
							message: `Please complete the fields. ${items.join(', ')}`
						});
					}
					console.error(error);
					return JSONResponse(null, {
						success: false,
						message: "There's a problem when deleting a stream instance."
					});
				}
			}
		},
		'/verify': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					vodId: z.string().min(1)
				});

				const result = await schema.safeParseAsync(data);

				if (!result.success) {
					console.error('[VOD Internal][/verify]: Invalid data.');
					return new Response('1');
				}

				const newData = result.data;

				const vodData = await prisma.vodProps.findFirst({
					select: {
						id: true,
						manifestPath: true
					},
					where: {
						id: newData.vodId
					}
				});

				if (!vodData) {
					console.error(`[VOD Internal][/verify]: No VOD information from ID "${newData.vodId}"`);
					return new Response('2');
				}

				const path = `${Bun.env.RECORD_PATH}/${vodData.manifestPath}`;
				const videoPath = `${path}/index.m3u8`;
				const imagePath = `${path}/thumbnail.jpg`;

				if (!(await Bun.file(videoPath).exists()) || !(await Bun.file(imagePath).exists())) {
					console.warn(
						`[VOD Internal][/verify]: Detected broken files from VOD id "${newData.vodId}". Deleting VOD information and its remaning files.`
					);

					await prisma.vodProps.deleteMany({
						where: {
							id: vodData.id
						}
					});

					await rm(path, { force: true, recursive: true });
					console.log(
						`[VOD Internal][/verify]: Files and information from VOD id "${newData.vodId}" are deleted successfully..`
					);
				} else {
					console.log(`[VOD Internal][/verify]: All files from VOD id "${newData.vodId}" exists.`);
				}
				return new Response('0');
			}
		},
		'/metadata': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					vodId: z.string().min(1),
					metadata: z.string().optional()
				});

				const result = await schema.safeParseAsync(data);

				if (!result.success) {
					console.error('[VOD Internal][/metadata]: Invalid data.');
					return new Response('1');
				}

				const newData = result.data;

				if (!newData.metadata?.length) {
					console.error(`[VOD Internal][/metadata]: No metadata from VOD id "${newData.vodId}".`);
					return new Response('2');
				}

				const resultMetadata = await ytdlpMetadataSchema.safeParseAsync(
					JSON.parse(atob(newData.metadata))
				);

				if (!resultMetadata.success) {
					console.error(
						`[VOD Internal][/metadata]: Invalid metadata from VOD id "${newData.vodId}".`
					);
					return new Response('2');
				}

				const metadata = resultMetadata.data;

				const vodMetadata = await prisma.vodMetadata.upsert({
					select: {
						streamId: true
					},
					where: {
						streamId: `${metadata.extractor}:${metadata.id}`
					},
					update: {
						title: metadata.fulltitle,
						dateUploaded: new Date(metadata.timestamp * 1000).toISOString(),
						webpageUrl: metadata.webpage_url
					},
					create: {
						streamId: `${metadata.extractor}:${metadata.id}`,
						title: metadata.fulltitle,
						description: metadata.description,
						dateUploaded: new Date(metadata.timestamp * 1000).toISOString(),
						uploader: metadata.uploader,
						webpageUrl: metadata.webpage_url
					}
				});

				await prisma.vodProps.updateMany({
					where: {
						id: newData.vodId
					},
					data: {
						metadataId: vodMetadata.streamId
					}
				});
				console.log(
					`[VOD Internal][/metadata]: Metadata from VOD id "${newData.vodId}" saved successfully.`
				);
				return new Response('0');
			}
		},
		'/publish': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					id: z.string().min(1)
				});

				try {
					const newData = await schema.parseAsync(data);

					const creatorData = await prisma.creator.findFirst({
						select: {
							name: true
						},
						where: {
							name: newData.id
						}
					});

					if (!creatorData) {
						console.error(`[VOD Internal][/publish]: Path "${newData.id}" not found.`);
						return new Response('2');
					}

					let streamVodId: string = '';

					while (true) {
						streamVodId = randomStringGenerator();
						const existingStream = await prisma.vodProps.findFirst({
							select: {
								id: true
							},
							where: {
								id: streamVodId
							}
						});

						if (existingStream) {
							console.warn(
								`[VOD Internal][/publish]: VOD id "${streamVodId}" already taken. Retrying.`
							);
							continue;
						}
						break;
					}

					const manifestPath = `${creatorData.name}/${streamVodId}`;
					await prisma.vodProps.create({
						data: {
							id: streamVodId,
							creatorName: creatorData.name,
							manifestPath: manifestPath,
							datePublished: new Date().toISOString()
						}
					});
					console.log(
						`[VOD Internal][/publish]: VOD id for path "${newData.id}" created successfully. (${streamVodId})`
					);
					return new Response(streamVodId);
				} catch (error) {
					if (error instanceof z.ZodError) {
						console.error('[VOD Internal][/publish]: Invalid data.');
						return new Response('1');
					}
					console.error(error);
					return new Response('-1', { status: 500 });
				}
			}
		}
	}
});

console.log(`VOD Internal Service API: Listening ${_server.hostname}:${_server.port}`);
