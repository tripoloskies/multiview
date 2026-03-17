import z from 'zod';
import { prisma } from '@shared/database';
import { restartStreamInstance } from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		path: z.string().min(1)
	});
	try {
		const newData = await schema.parseAsync(data);

		await prisma.activeStreams.upsert({
			where: {
				creatorName: newData.path
			},
			update: {
				status: 'Restarting'
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
				status: 'Restarting'
			}
		});

		await restartStreamInstance(newData.path);

		await Bun.sleep(1000);

		return wsResponse(null, {
			success: true,
			message: `Instance ${newData.path} restarted successfully.`
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
