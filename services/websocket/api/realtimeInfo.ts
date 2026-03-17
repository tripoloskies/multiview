import { actions as talk } from './talk';
import { actions as getServerTime } from './getServerTime';
import { actions as listActiveStream } from './listActiveStream';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import {
	realtimeResponseSchema,
	type getServerTimeResponseSchema,
	type listActiveStreamsResponseSchema
} from '@shared/schema/websocket';

export const actions: wsActions = async () => {
	const talkRes = await talk({});

	if (!talkRes.success) {
		return talkRes;
	}

	const timeRes = await getServerTime({});
	const streamRes = await listActiveStream({});

	if (!timeRes.success || !streamRes.success) {
		console.error('[wsApi][realtimeInfo]: Internal Server Error.');
		return wsResponse(null, {
			success: false,
			message: 'Internal Server Error'
		});
	}

	return wsResponse(realtimeResponseSchema, {
		success: true,
		message: talkRes.message,
		data: {
			...(timeRes.data as getServerTimeResponseSchema),
			...(streamRes.data as listActiveStreamsResponseSchema)
		}
	});
};
