import {
	deleteStreamInstance,
	listStreamInstance
} from '$services/instance/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	try {
		const instanceNames: string[] = (await listStreamInstance()).map(
			(instance) => instance.name
		);

		if (await deleteStreamInstance(instanceNames)) {
			return wsResponse(null, {
				success: true,
				message: `All instances are deleted successfully.`
			});
		} else {
			return wsResponse(null, {
				success: false,
				message: `Some instances are failed to delete.`
			});
		}
	} catch {
		return wsResponse(null, {
			success: false,
			message:
				"There's a problem when deleting an instance. Internal Server Error."
		});
	}
};
