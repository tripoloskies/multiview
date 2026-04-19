import { sendPersistCommand } from '$lib/api/websocket.svelte';
import type { realtimeResponseSchema } from '@shared/schema/websocket';
import type { instanceSchema } from '@shared/schema/instance';
import type { recordGetDiskStatus } from '@shared/schema/record';

export type infoType = {
	instances: instanceSchema[];
	isServerActive: boolean;
	serverTime: string;
	diskSpace: string;
	diskStatus: recordGetDiskStatus;
};

export const info: infoType = $state({
	paths: [],
	instances: [],
	isServerActive: false,
	serverTime: '00:00:00.000000',
	diskSpace: '',
	diskStatus: 'ok'
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
			const { instances, serverTime, diskSpace, diskStatus } =
				data as realtimeResponseSchema;

			info.serverTime = String(serverTime || '00:00:00.000000');
			info.instances = instances;
			info.diskSpace = diskSpace;
			info.diskStatus = diskStatus;
		}
	});
}
