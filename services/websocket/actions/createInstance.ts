import z from 'zod';
import { addStreamInstance } from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import { streamEventResponseSchema } from '@shared/schema/websocket';
import { isInstanceOnline } from '@shared/utils/status';
import {
	TWITCH_URL_REGEX,
	YT_URL_REGEX,
	PATH_REGEX,
	TRIM_LEAD_TRAIL_SLASH_REGEX
} from '@shared/utils/regex';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		url: z.string().min(1),
		path: z.string().min(1).toLowerCase(),
		lowLatency: z.boolean(),
		log: z.boolean()
	});

	try {
		const newData = await schema.parseAsync(data);
		newData.path = decodeURIComponent(newData.path)
			.replace(TRIM_LEAD_TRAIL_SLASH_REGEX, '')
			.replace(PATH_REGEX, '_');
		if (YT_URL_REGEX.test(newData.url)) {
			newData.path = 'yt/' + newData.path;
		} else if (TWITCH_URL_REGEX.test(newData.url)) {
			newData.path = 'twitch/' + newData.path;
		} else {
			newData.path = 'others/' + newData.path;
		}

		if (await isInstanceOnline(newData.path)) {
			return {
				success: false,
				message: `Adding stream denied. Instance "${newData.path}" is currently online.`
			};
		}

		if (
			!(await addStreamInstance(
				newData.url,
				newData.path,
				newData.lowLatency,
				newData.log
			))
		) {
			return {
				success: false,
				message: `Adding stream "${newData.path}" is denied.`
			};
		}

		const newPath: string = newData.path;

		return wsResponse(streamEventResponseSchema, {
			success: true,
			message: `Stream ${newData.path} added successfully!`,
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
			message: "There's a problem when adding a stream. Internal Server Error."
		});
	}
};
