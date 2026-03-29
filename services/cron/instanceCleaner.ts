import {
	deleteStoppedInstances,
	listPM2Instance
} from '$services/instance/client';
import { prisma } from '@shared/database';

async function execute(): Promise<void> {
	console.log('Instance cleaner started.');
	while (true) {
		if (await deleteStoppedInstances()) {
			console.log('Stopped instances deleted successfully.');
		}

		const currentActiveInstances = (await listPM2Instance())
			.filter(({ name }) => name !== undefined)
			.map(({ name }) => name);

		const instanceNamesToBeDeleted = (
			await prisma.instance.findMany({
				select: { pathName: true }
			})
		)
			.filter(({ pathName }) => !currentActiveInstances.includes(pathName))
			.map(({ pathName }) => pathName);

		await prisma.instance.deleteMany({
			where: {
				pathName: {
					in: instanceNamesToBeDeleted
				}
			}
		});

		await Bun.sleep(500);
	}
}

execute();
