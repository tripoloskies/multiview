import { prisma } from '@shared/database';
import { wsResponse } from '@shared/utils/api';
import type { instanceSchema } from '@shared/schema/instance';
import { type wsActions } from '@shared/types/websocket';
import { controlApiPathsResponse } from '@shared/schema/mediamtx';
import { listActiveStreamsResponseSchema } from '@shared/schema/websocket';
import {
	listStreamInstance,
	deleteStoppedInstances
} from '$services/instance/client';

export const actions: wsActions = async () => {
	try {
		const request: Response = await fetch(
			`http://${Bun.env.MEDIAMTX_HOST}:9997/v3/paths/list`
		);

		if (request.status !== 200) {
			return wsResponse(null, {
				success: false,
				message: 'MediaMTX server is not alive.'
			});
		}

		const parseResponse = await controlApiPathsResponse.safeParseAsync(
			await request.json()
		);

		if (!parseResponse.success) {
			return wsResponse(null, {
				success: false,
				message: 'MediaMTX server response does not match to the schema.'
			});
		}

		const listData = parseResponse.data;

		const instances = await listStreamInstance();

		await deleteStoppedInstances();

		const instancesWithStatus: instanceSchema[] = [];

		for (const list of instances) {
			const activeStreamsData = await prisma.activeStreams.findFirst({
				select: {
					status: true
				},
				where: {
					creatorName: list.name
				}
			});

			instancesWithStatus.push({
				...list,
				status: activeStreamsData ? activeStreamsData?.status : 'No Report'
			});
		}
		return wsResponse(listActiveStreamsResponseSchema, {
			success: true,
			message: 'OK',
			data: {
				paths: listData.items,
				instances: instancesWithStatus
			}
		});
	} catch {
		return wsResponse(null, {
			success: false,
			message: 'Internal Server Error.'
		});
	}
};
