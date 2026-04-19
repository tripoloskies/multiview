import z from 'zod';
import { getStreamInstance } from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import { getStreamResponseSchema } from '@shared/schema/websocket';
import { TRIM_LEAD_TRAIL_SLASH_REGEX, PATH_REGEX } from '@shared/utils/regex';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		path: z.string().min(1)
	});
	try {
		const newData = await schema.parseAsync(data);
		newData.path = decodeURIComponent(newData.path)
			.replace(TRIM_LEAD_TRAIL_SLASH_REGEX, '')
			.replace(PATH_REGEX, '_');

		const instance = await getStreamInstance(newData.path);
		if (!instance) {
			return wsResponse(null, {
				success: false,
				message: `Instance ${newData.path} not found`
			});
		}

		return wsResponse(getStreamResponseSchema, {
			success: true,
			message: `OK`,
			data: instance
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
			message:
				"There's an error getting instance information. Internal Server Error."
		});
	}
};
