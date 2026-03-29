import { deleteStoppedInstances } from '$services/instance/client';

async function execute(): Promise<void> {
	console.log('Instance cleaner started.');
	while (true) {
		if (await deleteStoppedInstances()) {
			console.log('Stopped instances deleted successfully.');
		}
		await Bun.sleep(500);
	}
}

execute();
