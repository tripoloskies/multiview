import {
	getReadableRecordingDiskSpace,
	getRecordingDiskStatus
} from '$services/recording/stats';
import { getRecordingStatsResponseSchema } from '@shared/schema/websocket';
import { type wsActions } from '@shared/types/websocket';
import { wsResponse } from '@shared/utils/api';

export const actions: wsActions = async () => {
	return wsResponse(getRecordingStatsResponseSchema, {
		success: true,
		message: 'OK',
		data: {
			diskSpace: await getReadableRecordingDiskSpace(),
			diskStatus: await getRecordingDiskStatus()
		}
	});
};
