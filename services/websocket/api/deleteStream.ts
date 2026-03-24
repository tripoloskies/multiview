import z from 'zod';
import {
	deleteStreamInstance,
	getStreamInstance
} from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async (data) => {
	const schema = z.object({
		path: z.string().min(1)
	});
	try {
		const newData = await schema.parseAsync(data);

		const instance = await getStreamInstance(newData.path);

		if (!instance) {
			return wsResponse(null, {
				success: false,
				message: `Instance "${newData.path}" does not exist.`
			});
		}

		await deleteStreamInstance(newData.path);

		return wsResponse(null, {
			success: true,
			message: `Instance ${newData.path} deleted successfully.`
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
			message: "There's a problem when deleting instance."
		});
	}
};
