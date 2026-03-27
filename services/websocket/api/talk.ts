import { isStreamingAlive } from '$services/streaming/client';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	if (await isStreamingAlive()) {
		return wsResponse(null, {
			success: true,
			message: 'MediaMTX server is alive.'
		});
	} else {
		return wsResponse(null, {
			success: false,
			message: 'MediaMTX server is not alive.'
		});
	}
};
