import { sendPersistCommand } from '$lib/api/websocket.svelte';
import type { realtimeResponseSchema } from '@shared/schema/websocket';
import type { instanceSchema } from '@shared/schema/instance';
import type { controlApiPathsList } from '@shared/schema/mediamtx';

export type infoType = {
	paths: controlApiPathsList[];
	instances: instanceSchema[];
	isServerActive: boolean;
	serverTime: string;
};

export const info: infoType = $state({
	paths: [],
	instances: [],
	isServerActive: false,
	serverTime: '00:00:00.000000'
});

export function talkStart(): string {
	return sendPersistCommand({
		cmdName: 'talk',
		data: {},
		callback: function ({ success }) {
			info.isServerActive = success;
		}
	});
}

export function infoStart(): string {
	return sendPersistCommand({
		cmdName: 'realtimeInfo',
		data: {},
		callback: function ({ success, data }) {
			if (!success) {
				return;
			}
			const { paths, instances, serverTime } = data as realtimeResponseSchema;

			info.serverTime = String(serverTime || '00:00:00.000000');
			info.paths = [...paths];
			info.instances = [...instances];
		}
	});
}
