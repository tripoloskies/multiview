import z from 'zod';
import { prisma } from '@shared/database';
import { getStreamInstance } from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import { getStreamResponseSchema } from '@shared/schema/websocket';
import { isActiveStreamOnline } from '@shared/utils/status';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		path: z.string().min(1)
	});
	try {
		const newData = await schema.parseAsync(data);
		const instance = await getStreamInstance(newData.path);
		const mediaUrl: string = `${newData.path}`;

		if (!instance) {
			return wsResponse(null, {
				success: false,
				message: `Instance ${newData.path} not found`
			});
		}

		const activeStreamsData = await prisma.activeStreams.findFirst({
			select: {
				status: true
			},
			where: {
				creatorName: newData.path
			}
		});

		if (!activeStreamsData || !instance) {
			return wsResponse(null, {
				success: false,
				message: 'No status for this?'
			});
		}

		return wsResponse(getStreamResponseSchema, {
			success: true,
			message: `OK`,
			data: {
				status: activeStreamsData.status,
				url: mediaUrl,
				online: await isActiveStreamOnline(mediaUrl),
				instance: instance
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
			message: "There's a problem when creating a stream information."
		});
	}
};
