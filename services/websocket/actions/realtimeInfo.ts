import { actions as talk } from './talk';
import { actions as getServerTime } from './getServerTime';
import { actions as listInstance } from './listInstance';
import { actions as recordingStats } from './recordingStats';

import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';
import {
	realtimeResponseSchema,
	type getRecordingStatsResponseSchema,
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
	const recordingStatsResponse = await recordingStats({});

	if (
		!serverTimeResponse.success ||
		!listInstanceResponse.success ||
		!recordingStatsResponse.success
	) {
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
			...(listInstanceResponse.data as listInstancesResponseSchema),
			...(recordingStatsResponse.data as getRecordingStatsResponseSchema)
		}
	});
};
