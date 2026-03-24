import { wsResponse } from '@shared/utils/api';
import { type wsActions } from '@shared/types/websocket';
import { listActiveStreamsResponseSchema } from '@shared/schema/websocket';
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

		return wsResponse(listActiveStreamsResponseSchema, {
			success: true,
			message: 'OK',
			data: {
				instances
			}
		});
	} catch {
		return wsResponse(null, {
			success: false,
			message: 'Internal Server Error.'
		});
	}
};
