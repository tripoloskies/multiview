import z from 'zod';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import { streamEventResponseSchema } from '@shared/schema/websocket';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		path: z.string().min(1)
	});

	try {
		const newData = await schema.parseAsync(data);
		return wsResponse(streamEventResponseSchema, {
			success: true,
			message: `Opening instance ${newData.path}...`,
			data: {
				eventUrl: `/events/log?path=${encodeURIComponent(newData.path)}`
			}
		});
	} catch (event) {
		if (event instanceof z.ZodError) {
			const items: PropertyKey[] = [];
			for (const issue of event.issues) {
				items.push(...issue.path);
			}
			return wsResponse(null, {
				success: false,
				message: `Please complete the fields. ${items.join(', ')}`
			});
		}
		return wsResponse(null, {
			success: false,
			message: "There's a problem when creating a stream information."
		});
	}
};
