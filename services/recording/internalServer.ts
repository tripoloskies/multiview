import z from 'zod';
import { rm } from 'node:fs/promises';
import { prisma } from '@shared/database';
import { ytdlpMetadataSchema } from '@shared/schema/yt-dlp';
import { randomStringGenerator } from '@shared/utils/browser';
import { JSONResponse } from '@shared/utils/api';
import {
	recordGetSchema,
	recordGetPathSchema,
	recordListsSchema,
	recordListsPathSchema,
	recordManifestType
} from '@shared/schema/record';
import { isInstanceOnline } from '@shared/utils/status';
import { getRecordingDiskStatus } from './stats';
import { file } from 'bun';

const _server = Bun.serve({
	port: 3002,
	routes: {
		'/list/videos': {
			POST: async (request: Bun.BunRequest) => {
				const data = await request.json();
				const schema = z.object({
					path: z.string().optional(),
					page: z.number(),
					maxItems: z.number().optional().default(5)
				});

				try {
					const newData = await schema.parse(data);

					if (newData.page < 1) {
						console.error(
							`[Recordings Internal][/list/videos]: Value of page must not lower than 1. Request data wants page=${newData.page}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of page must not lower than 1.'
						});
					}

					if (newData.maxItems < 1) {
						console.error(
							`[Recordings Internal][/list/videos]: Value of Max Items must not lower than 1. Request data wants maxItems=${newData.maxItems}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of Max Items must not lower than 1.'
						});
					}

					const itemCount = await prisma.record.count();
					const recordings = await prisma.record.findMany({
						select: {
							id: true,
							datePublished: true,
							path: {
								select: {
									name: true
								}
							}
						},
						where: {
							pathName: newData.path
						},
						orderBy: {
							datePublished: 'desc'
						},
						take: newData.maxItems,
						skip: newData.maxItems * newData.page - newData.maxItems
					});

					console.log(
						`[Recordings Internal][/list/videos]: Retrieved items: ${recordings.length}`
					);

					return JSONResponse(recordListsSchema, {
						success: true,
						message: 'OK',
						data: {
							count: itemCount,
							lists: recordings
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(
							`[Recordings Internal][/list/videos]: Invalid data. Missing fields (${items.join(', ')})`
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
		'/list/paths': {
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
							`[Recordings Internal][/list/paths]: Value of page must not lower than 1. Request data wants page=${newData.page}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of page must not lower than 1.'
						});
					}

					if (newData.maxItems < 1) {
						console.error(
							`[Recordings Internal][/list/paths]: Value of Max Items must not lower than 1. Request data wants maxItems=${newData.maxItems}`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Value of Max Items must not lower than 1.'
						});
					}

					const paths = await prisma.path.findMany({
						select: {
							name: true,
							_count: {
								select: {
									record: true
								}
							}
						},
						orderBy: {
							record: {
								_count: 'desc'
							}
						},
						take: newData.maxItems,
						skip: newData.maxItems * newData.page - newData.maxItems
					});

					const formattedPaths = paths.map(({ name, _count }) => {
						return {
							name: name,
							items: _count.record
						};
					});

					console.log(
						`[Recordings Internal][/list]: Retrieved items: ${formattedPaths.length}`
					);

					return JSONResponse(recordListsPathSchema, {
						success: true,
						message: 'OK',
						data: {
							lists: formattedPaths
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(
							`[Recordings Internal][/list]: Invalid data. Missing fields (${items.join(', ')})`
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
		'/get/path': {
			GET: async (request: Bun.BunRequest) => {
				const url = new URL(request.url);

				const data = {
					path: url.searchParams.get('name')
				};

				const schema = z.object({
					path: z.string().min(1)
				});

				try {
					const newData = await schema.parse(data);

					const info = await prisma.path.findFirst({
						select: {
							name: true,
							instance: {
								select: {
									status: true
								}
							},
							_count: {
								select: {
									record: true
								}
							}
						},
						where: {
							name: newData.path
						}
					});

					if (!info) {
						console.error(
							`[Recordings Internal][/get/:path]: Path "${newData.path}" not found.`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Path not found'
						});
					}

					let liveStatus: string;

					if (await isInstanceOnline(info.name)) {
						liveStatus = 'online';
					} else {
						liveStatus = info.instance?.status || 'offline';
					}

					return JSONResponse(recordGetPathSchema, {
						success: true,
						message: 'OK',
						data: {
							name: info.name,
							videoCount: info._count.record,
							liveStatus: liveStatus
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(
							`[Recordings Internal][/get/path/:path]: Invalid data. Missing fields (${items.join(', ')})`
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
		'/get/stats/disk': {
			GET: async () => {
				const result = await getRecordingDiskStatus();
				switch (result) {
					case 'ok':
					case 'low_space':
						return new Response('0');
					case 'critical_low_space':
						return new Response('1');
					case 'full':
						return new Response('2');
					default:
						return new Response('-1`');
				}
			}
		},
		'/get/video/:id': {
			GET: async (request: Bun.BunRequest) => {
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
							`[Recordings Internal][/get/video/:id]: Record id "${newData.id}" not found.`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Record not found'
						});
					}

					const recordSourceMetadata = record.sourceMetadataId
						? await prisma.recordSourceMetadata.findFirst({
								where: {
									id: record.sourceMetadataId
								}
							})
						: null;

					const fullManifestPath: string = `${Bun.env.RECORD_PATH}/${record.manifestPath}`;

					let manifestFile: string;
					let manifestType: recordManifestType;

					if (await file(`${fullManifestPath}/index.m3u8`).exists()) {
						manifestFile = `/api/recordings/fetch/${newData.id}/index.m3u8`;
						manifestType = 'hls';
					} else {
						console.error(
							`[Recordings Internal][/get/video/:id]: Missing manifest file from Record id "${newData.id}".`
						);
						return JSONResponse(null, {
							success: false,
							message: 'Record Manifest file not found.'
						});
					}

					return JSONResponse(recordGetSchema, {
						success: true,
						message: 'OK',
						data: {
							info: {
								...record,
								manifestUrl: manifestFile,
								manifestType: manifestType
							},
							metadata: recordSourceMetadata
						}
					});
				} catch (error) {
					if (error instanceof z.ZodError) {
						const items: PropertyKey[] = [];
						for (const issue of error.issues) {
							items.push(...issue.path);
						}
						console.error(
							`[Recordings Internal][/get/video/:id]: Invalid data. Missing fields (${items.join(', ')})`
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
		'/verify': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					recordId: z.string().min(1)
				});

				const result = await schema.safeParseAsync(data);

				if (!result.success) {
					console.error('[Recordings Internal][/verify]: Invalid data.');
					return new Response('1');
				}

				const newData = result.data;

				const record = await prisma.record.findFirst({
					select: {
						id: true,
						manifestPath: true
					},
					where: {
						id: newData.recordId
					}
				});

				if (!record) {
					console.error(
						`[Recordings Internal][/verify]: No Record information from ID "${newData.recordId}"`
					);
					return new Response('2');
				}

				const path = `${Bun.env.RECORD_PATH}/${record.manifestPath}`;
				const videoPath = `${path}/index.m3u8`;
				const imagePath = `${path}/thumbnail.jpg`;

				if (
					!(await Bun.file(videoPath).exists()) ||
					!(await Bun.file(imagePath).exists())
				) {
					console.warn(
						`[Recordings Internal][/verify]: Detected broken files from Record id "${newData.recordId}". Deleting Record information and its remaning files.`
					);

					await prisma.record.deleteMany({
						where: {
							id: record.id
						}
					});

					await rm(path, { force: true, recursive: true });
					console.log(
						`[Recordings Internal][/verify]: Files and information from Record ID "${newData.recordId}" are deleted successfully..`
					);
				} else {
					console.log(
						`[Recordings Internal][/verify]: All files from Record id "${newData.recordId}" exists.`
					);
				}
				return new Response('0');
			}
		},
		'/metadata': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					recordId: z.string().min(1),
					metadata: z.string().optional()
				});

				const result = await schema.safeParseAsync(data);

				if (!result.success) {
					console.error('[Recordings Internal][/metadata]: Invalid data.');
					return new Response('1');
				}

				const newData = result.data;

				if (!newData.metadata?.length) {
					console.error(
						`[Recordings Internal][/metadata]: No metadata from Record id "${newData.recordId}".`
					);
					return new Response('2');
				}

				const resultMetadata = await ytdlpMetadataSchema.safeParseAsync(
					JSON.parse(atob(newData.metadata))
				);

				if (!resultMetadata.success) {
					console.error(
						`[Recordings Internal][/metadata]: Invalid metadata from Record id "${newData.recordId}".`
					);
					return new Response('2');
				}

				const metadata = resultMetadata.data;

				const extractor =
					metadata.extractor.split(':')[0]?.toLowerCase() || 'others';
				let sourceId: string | undefined;
				let uploaderId: string;

				switch (extractor) {
					case 'youtube':
						uploaderId = metadata.channel_id || 'unknown';
						break;
					case 'twitch':
						metadata.fulltitle = metadata.description;
						sourceId = metadata.uploader.toLowerCase();
						uploaderId = metadata.uploader.toLowerCase();
						break;
					case 'kick':
						sourceId = metadata.uploader.toLowerCase();
						uploaderId = metadata.uploader.toLowerCase();
						break;
					default:
						uploaderId = metadata.channel_id || 'unknown';
				}

				const recordSourceMetadata = await prisma.recordSourceMetadata.upsert({
					select: {
						id: true
					},
					where: {
						id: `${extractor}:${metadata.id}`
					},
					update: {
						title: metadata.fulltitle,
						dateUploaded: new Date(metadata.timestamp * 1000).toISOString(),
						webpageUrl: metadata.webpage_url
					},
					create: {
						id: `${extractor}:${metadata.id}`,
						sourceId: sourceId || metadata.id,
						uploaderId: uploaderId,
						title: metadata.fulltitle,
						description: metadata.description,
						dateUploaded: new Date(metadata.timestamp * 1000).toISOString(),
						uploader: metadata.uploader,
						webpageUrl: metadata.webpage_url
					}
				});

				await prisma.record.updateMany({
					where: {
						id: newData.recordId
					},
					data: {
						sourceMetadataId: recordSourceMetadata.id
					}
				});
				console.log(
					`[Recordings Internal][/metadata]: Metadata from Record id "${newData.recordId}" saved successfully.`
				);
				return new Response('0');
			}
		},
		'/publish': {
			POST: async (request: Bun.BunRequest) => {
				const data = Object.fromEntries((await request.formData()).entries());
				const schema = z.object({
					path: z.string().min(1)
				});

				try {
					const newData = await schema.parseAsync(data);

					const pathData = await prisma.instance.findFirst({
						select: {
							pathName: true
						},
						where: {
							pathName: newData.path
						}
					});

					if (!pathData) {
						console.error(
							`[Recordings Internal][/publish]: Path "${newData.path}" not found.`
						);
						return new Response('2');
					}

					let recordId: string = '';

					while (true) {
						recordId = randomStringGenerator();
						const existingStream = await prisma.record.findFirst({
							select: {
								id: true
							},
							where: {
								id: recordId
							}
						});

						if (existingStream) {
							console.warn(
								`[Recordings Internal][/publish]: Record ID "${recordId}" already taken. Retrying.`
							);
							continue;
						}
						break;
					}

					const manifestPath = `${pathData.pathName}/${recordId}`;
					await prisma.record.create({
						data: {
							id: recordId,
							pathName: pathData.pathName,
							manifestPath: manifestPath,
							datePublished: new Date().toISOString()
						}
					});
					console.log(
						`[Recordings Internal][/publish]: Record ID for path "${newData.path}" created successfully. (${recordId})`
					);
					return new Response(recordId);
				} catch (error) {
					if (error instanceof z.ZodError) {
						console.error('[Recordings Internal][/publish]: Invalid data.');
						return new Response('1');
					}
					console.error(error);
					return new Response('-1', { status: 500 });
				}
			}
		}
	}
});

console.log(
	`Recordings Internal Service API: Listening ${_server.hostname}:${_server.port}`
);
