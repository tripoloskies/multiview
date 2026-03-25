import { $, redis } from 'bun';
import pm2 from 'pm2';
import { type instanceSchema } from '@shared/schema/instance';
import { prisma } from '@shared/database';
import { isActiveStreamOnline } from '@shared/utils/status';

let isConnected: boolean = false;

type instance = instanceSchema;

const INTERNAL_REGEX: RegExp = /^internal:\S*$/;
const INSTANCE_CACHE_KEY: string = 'instance';
const INSTANCE_CACHE_EXPIRE: number = 5;

function isNameIllegal(name: string): boolean {
	return INTERNAL_REGEX.test(name) || !name.length;
}

export const pm2Connect = (): Promise<boolean> => {
	if (isConnected) {
		return new Promise((resolve) => {
			resolve(true);
		});
	}

	return new Promise((resolve, reject) => {
		pm2.connect(true, (error) => {
			if (error) {
				isConnected = false;
				reject(false);
				return;
			}

			isConnected = true;
			resolve(true);
		});
	});
};

export const pm2Disconnect = (): void => {
	if (!isConnected) {
		return;
	}
	pm2.disconnect();
};

const pm2Start = (options: pm2.StartOptions): Promise<pm2.Proc> => {
	return new Promise((resolve, reject) => {
		pm2.start(options, (error, proc) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(proc);
		});
	});
};

const pm2List = (): Promise<pm2.ProcessDescription[]> => {
	return new Promise((resolve, reject) => {
		pm2.list((error, processDescriptionList) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(processDescriptionList);
		});
	});
};

const pm2Delete = (process: string | number): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		pm2.delete(process, (error) => {
			setTimeout(() => {
				if (error) {
					reject(error);
					return;
				}
				resolve(true);
			}, 1000);
		});
	});
};

const pm2Describe = (
	process: string | number
): Promise<pm2.ProcessDescription[]> => {
	return new Promise((resolve, reject) => {
		pm2.describe(process, (error, ProcessDescription) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(ProcessDescription);
		});
	});
};

const pm2Restart = (process: string | number): Promise<true> => {
	return new Promise((resolve, reject) => {
		pm2.restart(process, (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(true);
		});
	});
};

async function createPM2Instance(config: pm2.StartOptions): Promise<boolean> {
	if (!config?.name) {
		return false;
	}

	if (isNameIllegal(config.name)) {
		return false;
	}

	try {
		const description = await pm2Describe(config.name);
		if (description && description.length > 0) {
			await pm2Delete(config.name);
		}
		await pm2Start(config);
		console.log(`Started: ${config.name}`);
		return true;
	} catch (err) {
		console.error('PM2 Async Error:', err);
		return false;
	}
}

async function restartPM2Instance(name: string): Promise<boolean> {
	if (!name?.length || isNameIllegal(name)) {
		return false;
	}

	try {
		await pm2Restart(name);
		await Bun.sleep(500);
		await invalidateInstanceCache(name);
		return true;
	} catch {
		return false;
	}
}

async function checkPM2Instance(name: string): Promise<boolean> {
	if (!name.length) {
		return false;
	}
	try {
		const description = await pm2Describe(name);
		return description && description.length > 0;
	} catch (err) {
		console.error('PM2 Async Error:', err);
		return false;
	}
}

export async function listPM2Instance(): Promise<pm2.ProcessDescription[]> {
	let lists: pm2.ProcessDescription[] = [];
	try {
		lists = await pm2List();
	} catch (err) {
		console.error('PM2 Async Error:', err);
	}
	return lists.filter((list) => !isNameIllegal(list?.name || ''));
}

export async function getPM2Instance(
	name: string
): Promise<pm2.ProcessDescription | null> {
	let lists: pm2.ProcessDescription[] = [];
	try {
		lists = await pm2Describe(name);
	} catch (err) {
		console.error('PM2 Async Error:', err);
	}

	return lists[0] || null;
}

async function destroyPM2Instance(name: string | string[]): Promise<boolean> {
	try {
		if (typeof name === 'string') {
			name = [name];
		}

		for (const _name of name) {
			if (isNameIllegal(_name)) {
				continue;
			}

			const description = await pm2Describe(_name);
			if (description && description.length > 0) {
				await pm2Delete(_name);
				return true;
			}
		}
	} catch (err) {
		console.error('PM2 Async Error:', err);
	}
	return false;
}

async function destroyStoppedPM2Instance(): Promise<boolean> {
	let isSomeInstanceDeleted = false;
	try {
		const lists = await pm2List();

		for (const list of lists) {
			if (!list?.name) {
				continue;
			}
			if (list.pm2_env?.status === 'stopped') {
				await pm2Delete(list.name);
				isSomeInstanceDeleted = true;
			}
		}
		return isSomeInstanceDeleted;
	} catch (err) {
		console.error('PM2 Async Error:', err);
		return false;
	}
}

// For later use....
// export async function isStreamOnline(path: string): Promise<boolean> {
// 	const pathRequest = await fetch(
// 		`http:/${Bun.env.MEDIAMTX_HOST}:9997/v3/paths/get/${path}`
// 	);
// 	switch (pathRequest.status) {
// 		case 200:
// 			return true;
// 		// That's the only way to check if path exists without spending much time to parse the result.
// 		case 404:
// 			return false;
// 		default:
// 			throw new Error(
// 				'Something wrong with the server. Contact the administrator'
// 			);
// 	}
// }

export async function invalidateInstanceCache(
	name: string
): Promise<instance | null> {
	const selectedInstance = await getPM2Instance(name);

	if (!selectedInstance) {
		return null;
	}

	if (!selectedInstance.name?.length) {
		return null;
	}

	if (await redis.hexists(INSTANCE_CACHE_KEY, name)) {
		await redis.hdel(INSTANCE_CACHE_KEY, name);
	}

	const activeStreamsData = await prisma.activeStreams.findFirst({
		select: {
			status: true
		},
		where: {
			creatorName: name
		}
	});

	const instanceInfo = {
		name: name,
		labelName: `${name} ${selectedInstance?.pm2_env?.status}`,
		online: await isActiveStreamOnline(name),
		active: selectedInstance?.pm2_env?.status !== 'stopped',
		statusText: activeStreamsData ? activeStreamsData?.status : 'No Report',
		mediaUrl: name
	};

	await redis.hset(INSTANCE_CACHE_KEY, name, JSON.stringify(instanceInfo));

	return instanceInfo;
}

export async function invalidateAllInstanceCache(): Promise<instance[]> {
	const instances: instance[] = [];
	if (await redis.exists(INSTANCE_CACHE_KEY)) {
		await redis.del(INSTANCE_CACHE_KEY);
	}

	const lists = await listPM2Instance();
	for (const list of lists) {
		if (!list?.name?.length) {
			continue;
		}
		const res = await invalidateInstanceCache(list.name);

		if (res) {
			instances.push(res);
		}
	}

	return instances;
}

export async function listStreamInstance(): Promise<instance[]> {
	let newLists: instance[] = [];

	if ((await redis.ttl(INSTANCE_CACHE_KEY)) == -1) {
		await redis.expire(INSTANCE_CACHE_KEY, INSTANCE_CACHE_EXPIRE);
	}

	if (await redis.exists(INSTANCE_CACHE_KEY)) {
		const cachedData = await redis.hgetall(INSTANCE_CACHE_KEY);

		for (const key in cachedData) {
			if (!cachedData[key]) {
				continue;
			}
			newLists.push(JSON.parse(cachedData[key]));
		}
	} else {
		newLists = await invalidateAllInstanceCache();
	}
	return newLists;
}

export async function deleteStoppedInstances(): Promise<boolean> {
	const isSuccess = await destroyStoppedPM2Instance();
	if (isSuccess) {
		console.log(
			'[instance][deleteStoppedInstance] Stopped Instance deleted successfully.'
		);
		await redis.del(INSTANCE_CACHE_KEY);
	}
	return isSuccess;
}

export async function addStreamInstance(
	url: string,
	streamPath: string
): Promise<boolean> {
	let bunExecutablePath: string;
	let ytdlpExecutablePath: string;
	let streamlinkExecutablePath: string;
	try {
		const bunExecRelativePath = await $`which bun`.text();
		bunExecutablePath = await $`realpath "${bunExecRelativePath}"`.text();
	} catch {
		console.error(
			'[addStreamInstance:error] Use bun for JS runtime or install bun in your host machine. Cancelling...'
		);
		return false;
	}

	try {
		const ytdlpExecRelativePath = await $`which yt-dlp`.text();
		ytdlpExecutablePath = await $`realpath "${ytdlpExecRelativePath}"`.text();
	} catch {
		console.error(
			'[addStreamInstance:error] yt-dlp must be installed in your host machine. Cancelling...'
		);
		return false;
	}

	try {
		const streamlinkExecRelativePath = await $`which streamlink`.text();
		streamlinkExecutablePath =
			await $`realpath "${streamlinkExecRelativePath}"`.text();
	} catch {
		console.error(
			'[addStreamInstance:error] streamlink must be installed in your host machine. Cancelling...'
		);
		return false;
	}

	try {
		const status = await createPM2Instance({
			name: streamPath,
			script: `bash ./workers/streamCreate.sh "${url}" "${streamPath}" ${Bun.env.RECORD_PATH || ''} "${bunExecutablePath}" "${ytdlpExecutablePath}" "${streamlinkExecutablePath}" ${Bun.env.MEDIAMTX_HOST || ''}`,
			autorestart: false
		});

		await updateInstanceStatus(streamPath, 'Update', 'Added');

		return status;
	} catch (error) {
		console.warn(
			"[addStreamInstance:warning] There's a little bit of error creating PM2 instance. But it doesn't matter because the stream will be created anyway."
		);
		console.warn(error);
		return true;
	}
}

export async function checkStreamInstance(
	streamPath: string
): Promise<boolean> {
	return await checkPM2Instance(streamPath);
}

export async function getStreamInstance(
	streamPath: string
): Promise<instance | null> {
	const lists = await listStreamInstance();
	const selectedInstance = lists?.find((list) => list.name === streamPath);

	if (!selectedInstance) {
		return null;
	}

	return selectedInstance;
}

export async function deleteStreamInstance(
	streamPath: string
): Promise<boolean> {
	await prisma.activeStreams.upsert({
		where: {
			creatorName: streamPath
		},
		update: {
			status: 'Deleting...'
		},
		create: {
			creator: {
				connectOrCreate: {
					where: {
						name: streamPath
					},
					create: {
						name: streamPath
					}
				}
			},
			status: 'Deleting...'
		}
	});

	const isSuccess = await destroyPM2Instance(streamPath);

	await redis.del(INSTANCE_CACHE_KEY);
	await Bun.sleep(500);

	await prisma.activeStreams.deleteMany({
		where: {
			creatorName: streamPath
		}
	});

	return isSuccess;
}

export async function restartStreamInstance(name: string): Promise<boolean> {
	await updateInstanceStatus(name, 'Update', 'Restarting');
	return await restartPM2Instance(name);
}

export async function updateInstanceStatus(
	name: string,
	action: string,
	status: string
): Promise<boolean> {
	switch (action) {
		case 'Update':
			await prisma.activeStreams.upsert({
				where: {
					creatorName: name
				},
				update: {
					status: status
				},
				create: {
					creator: {
						connectOrCreate: {
							where: {
								name: name
							},
							create: {
								name: name
							}
						}
					},
					status: status
				}
			});

			await invalidateInstanceCache(name);
			break;
		case 'Delete':
			await prisma.activeStreams.deleteMany({
				where: {
					creatorName: name
				}
			});
			await invalidateInstanceCache(name);
			break;
		default:
			return false;
	}
	return true;
}
