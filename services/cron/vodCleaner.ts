import { prisma } from '@shared/database';
import { Glob } from 'bun';
import { rm } from 'node:fs/promises';
import { dirname } from 'node:path';

type pathsList = {
	id: string;
	fullPath: string;
};

async function execute(): Promise<void> {
	while (true) {
		const fileLists: Glob = new Glob(`${Bun.env.RECORD_PATH}/**/*.m3u8`);

		const paths: pathsList[] = [];
		const idsToDeleted: string[] = [];

		const vodDbLists = await prisma.vodProps.findMany({
			select: {
				id: true,
				manifestPath: true
			}
		});

		for await (const file of fileLists.scan('.')) {
			const splicedPath: string[] = file.split('/');
			splicedPath.splice(0, splicedPath.length - 2);
			if (!splicedPath[0]?.length) {
				continue;
			}
			paths.push({ id: splicedPath[0], fullPath: file });
		}

		for (const lists of vodDbLists) {
			const pathindex: number = paths.findIndex((path) => path.id === lists.id);
			if (pathindex === -1) {
				idsToDeleted.push(lists.id);
			} else {
				paths.splice(pathindex, 1);
			}
		}

		await prisma.vodProps.deleteMany({
			where: {
				id: {
					in: idsToDeleted
				}
			}
		});

		for (const { fullPath } of paths) {
			await rm(dirname(fullPath), {
				force: true,
				recursive: true
			});
		}

		console.log('Autocleaning job completed! See you in 5 minutes.');
		await Bun.sleep(1000 * 60 * 5);
	}
}

execute();
