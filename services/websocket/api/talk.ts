import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	try {
		const request = await fetch(`http://${Bun.env.MEDIAMTX_HOST}:9997/v3/info`);
		if (request.status !== 200) {
			return wsResponse(null, {
				success: false,
				message: 'MediaMTX server is not alive.'
			});
		}
		return wsResponse(null, {
			success: true,
			message: 'MediaMTX server is alive.'
		});
	} catch {
		return wsResponse(null, {
			success: false,
			message: 'MediaMTX server is not alive.'
		});
	}
};
