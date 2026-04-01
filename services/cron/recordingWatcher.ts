import {
	listStreamInstance,
	restartStreamInstance
} from '$services/instance/client';
import { getRecordingDiskStatus } from '$services/recording/stats';

async function execute(): Promise<void> {
	console.log('Recording Watcher started.');
	while (true) {
		const diskStatus = await getRecordingDiskStatus();
		const instances = await listStreamInstance();
		if (diskStatus !== 'ok' && diskStatus !== 'low_space') {
			for (const { name, online } of instances) {
				if (!online) {
					continue;
				}
				await restartStreamInstance(name);
			}
		}
		await Bun.sleep(500);
	}
}

execute();
