import {
	listStreamInstance,
	restartStreamInstance
} from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	try {
		const instanceNames: string[] = (await listStreamInstance()).map(
			(instance) => instance.name
		);

		if (await restartStreamInstance(instanceNames)) {
			return wsResponse(null, {
				success: true,
				message: `All instances are restarted successfully.`
			});
		} else {
			return wsResponse(null, {
				success: false,
				message: `Some instances are failed to restart. Try again.`
			});
		}
	} catch {
		return wsResponse(null, {
			success: false,
			message:
				"There's a problem when restarting an instance. Internal Server Error."
		});
	}
};
