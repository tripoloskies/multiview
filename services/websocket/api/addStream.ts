import z from 'zod';
import { prisma } from '@shared/database';
import { isStreamExists, addStreamInstance } from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import { streamEventResponseSchema } from '@shared/schema/websocket';

export const actions: wsActions = async (data) => {
	const TWITCH_URL_REGEX: RegExp = /^(https?:\/\/)?([a-z0-9]+\.)?twitch\.tv/;
	const YT_URL_REGEX: RegExp =
		/^(https?:\/\/)?([a-z0-9]+\.)?(youtube\.com|youtu\.be)/;

	const schema = z.object({
		url: z.string().min(1),
		path: z.string().min(1).toLowerCase()
	});

	try {
		const newData = await schema.parseAsync(data);

		if (YT_URL_REGEX.test(newData.url)) {
			newData.path = 'yt/' + newData.path;
		} else if (TWITCH_URL_REGEX.test(newData.url)) {
			newData.path = 'twitch/' + newData.path;
		} else {
			newData.path = 'others/' + newData.path;
		}

		if (await isStreamExists(newData.path)) {
			return {
				success: false,
				message: `Adding stream denied. Stream ${newData.path} is currently active.`
			};
		}

		if (!(await addStreamInstance(newData.url, newData.path))) {
			return {
				success: false,
				message: `Adding stream denied.`
			};
		}

		const newPath: string = newData.path;

		await prisma.activeStreams.upsert({
			where: {
				creatorName: newData.path
			},
			update: {
				status: 'Added'
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
				status: 'Added'
			}
		});

		return wsResponse(streamEventResponseSchema, {
			success: true,
			message: 'Stream instance created successfully!',
			data: {
				eventUrl: `/events/log?path=${encodeURIComponent(newPath)}`
			}
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			const items: PropertyKey[] = [];
			for (const issue of error.issues) {
				items.push(...issue.path);
			}
			return wsResponse(null, {
				success: false,
				message: `Please complete the fields. ${items.join(', ')}`
			});
		}
		return wsResponse(null, {
			success: false,
			message: "There's a problem when creating a stream instance."
		});
	}
};
