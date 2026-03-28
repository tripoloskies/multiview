import { wsResponse } from '@shared/utils/api';
import { type wsActions } from '@shared/types/websocket';
import { listInstancesResponseSchema } from '@shared/schema/websocket';
import {
	listStreamInstance,
	deleteStoppedInstances
} from '$services/instance/client';

export const actions: wsActions = async () => {
	try {
		const instances = (await listStreamInstance()).filter(
			(instance) => instance.active === true
		);

		await deleteStoppedInstances();

		return wsResponse(listInstancesResponseSchema, {
			success: true,
			message: 'OK',
			data: {
				instances
			}
		});
	} catch {
		return wsResponse(null, {
			success: false,
			message: "There's an error fetching instance list. Internal Server Error."
		});
	}
};
