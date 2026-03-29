import { actions as talk } from './talk';
import { actions as getServerTime } from './getServerTime';
import { actions as listInstance } from './listInstance';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import {
	realtimeResponseSchema,
	type getServerTimeResponseSchema,
	type listInstancesResponseSchema
} from '@shared/schema/websocket';

export const actions: wsActions = async () => {
	const talkResponse = await talk({});

	if (!talkResponse.success) {
		return talkResponse;
	}

	const serverTimeResponse = await getServerTime({});
	const listInstanceResponse = await listInstance({});

	if (!serverTimeResponse.success || !listInstanceResponse.success) {
		console.error('[wsApi][realtimeInfo]: Internal Server Error.');
		return wsResponse(null, {
			success: false,
			message: 'Internal Server Error'
		});
	}

	return wsResponse(realtimeResponseSchema, {
		success: true,
		message: listInstanceResponse.message,
		data: {
			...(serverTimeResponse.data as getServerTimeResponseSchema),
			...(listInstanceResponse.data as listInstancesResponseSchema)
		}
	});
};
