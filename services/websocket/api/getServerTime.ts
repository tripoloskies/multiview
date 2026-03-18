import { getServerTimeResponseSchema } from '@shared/schema/websocket';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	const now: Date = new Date();
	const time: string =
		now.toTimeString().split(' ')[0] +
		'.' +
		now.getMilliseconds().toString().padStart(3, '0');

	return wsResponse(getServerTimeResponseSchema, {
		success: true,
		message: 'OK',
		data: {
			serverTime: time
		}
	});
};
