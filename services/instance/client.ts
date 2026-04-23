import { $, redis } from 'bun';
import pm2 from 'pm2';
import { type instanceSchema } from '@shared/schema/instance';
import { prisma } from '@shared/database';
import { PrismaClientKnownRequestError } from '@shared/database/generated/prisma/internal/prismaNamespace';
import { getPlatformByPath } from '@shared/utils/regex';

let isConnected: boolean = false;

type instance = instanceSchema;

const INTERNAL_REGEX: RegExp = /^internal:\S*$/;
const INSTANCE_CACHE_KEY: string = 'instance';
const INSTANCE_CACHE_EXPIRE: number = 30;

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
			}, 50);
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
			setTimeout(() => {
				if (error) {
					reject(error);
					return;
				}
				resolve(true);
			}, 50);
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

async function destroyStoppedPM2Instance(name: string): Promise<boolean> {
	try {
		const instance = await pm2Describe(name);

		if (!instance.length) {
			return false;
		}
		if (instance[0] === undefined) {
			return false;
		}
		if (
			instance[0].pm2_env === undefined ||
			instance[0].pm2_env.status !== 'stopped'
		) {
			return false;
		}

		return await pm2Delete(name);
	} catch (err) {
		console.error('PM2 Async Error:', err);
		return false;
	}
}

// For later use....
// export async function isStreamOnline(path: string): Promise<boolean> {
// 	const pathRequest = await fetch(
// 		`http:/${Bun.env.STREAMING_HOST}:9997/v3/paths/get/${path}`
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
	if (!name.length) {
		return null;
	}

	const selectedInstance = await getPM2Instance(name);

	if (!selectedInstance) {
		return null;
	}

	if (!selectedInstance.name?.length) {
		return null;
	}

	const info = await prisma.path.findFirst({
		where: {
			name: name
		},
		select: {
			platform: true,
			instance: {
				select: {
					status: true,
					lowLatency: true,
					dateCreated: true,
					record: {
						select: {
							sourceMetadata: {
								select: {
									sourceId: true
								}
							}
						}
					}
				}
			},
			record: {}
		}
	});

	if (!info) {
		return null;
	}

	if (await redis.hexists(INSTANCE_CACHE_KEY, name)) {
		await redis.hdel(INSTANCE_CACHE_KEY, name);
	}
	const instanceInfo = {
		name: name,
		labelName: `${name} ${selectedInstance?.pm2_env?.status}`,
		lowLatency: info.instance?.lowLatency || false,
		platform: info.platform,
		streamSourceId: info.instance?.record?.sourceMetadata?.sourceId || null,
		online: info.instance?.status.toLowerCase() === 'online',
		active: selectedInstance?.pm2_env?.status !== 'stopped',
		statusText: info.instance ? info.instance?.status : 'No Report',
		dateCreated: info.instance?.dateCreated.getTime() || 0,
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

		const cachedInstance = await invalidateInstanceCache(list.name);

		if (cachedInstance) {
			instances.push(cachedInstance);
		}
	}

	return instances;
}

export async function listStreamInstance(): Promise<instance[]> {
	let newLists: instance[] = [];

	if ((await redis.ttl(INSTANCE_CACHE_KEY)) > 2) {
		const cachedData = await redis.hgetall(INSTANCE_CACHE_KEY);

		for (const key in cachedData) {
			if (!cachedData[key]) {
				continue;
			}
			newLists.push(JSON.parse(cachedData[key]));
		}
	} else {
		newLists = await invalidateAllInstanceCache();
		await redis.expire(INSTANCE_CACHE_KEY, INSTANCE_CACHE_EXPIRE + 2);
	}
	return newLists.sort((a, b) => {
		if (a.dateCreated === b.dateCreated) {
			return a.name > b.name ? 1 : -1;
		} else {
			return a.dateCreated > b.dateCreated ? 1 : -1;
		}
	});
}

export async function deleteStoppedInstances(): Promise<boolean> {
	let isSuccess: boolean = false;

	const instances = await pm2List();

	for (const { name, pm2_env } of instances) {
		if (
			pm2_env?.status === 'stopped' &&
			!isNameIllegal(name || '') &&
			name !== undefined
		) {
			if (!(await destroyStoppedPM2Instance(name))) {
				continue;
			}
			await prisma.instance.deleteMany({
				where: {
					pathName: name
				}
			});
			await redis.hdel(INSTANCE_CACHE_KEY, name);
			isSuccess = true;
		}
	}

	if (isSuccess) {
		console.log(
			'[instance][deleteStoppedInstance] Stopped Instances deleted successfully.'
		);
	}
	return isSuccess;
}

export async function addStreamInstance(
	url: string,
	path: string,
	lowLatency: boolean = false,
	log: boolean = false
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
			name: path,
			script: `bash ./instance/workers/create.sh "${url}" "${path}" ${Bun.env.RECORD_PATH || ''} "${bunExecutablePath}" "${ytdlpExecutablePath}" "${streamlinkExecutablePath}" ${Bun.env.STREAMING_HOST || ''} ${log ? '1' : '0'} ${lowLatency ? '1' : '0'}`,
			autorestart: false
		});

		await updateInstanceStatus(path, 'Update', 'Added');
		return status;
	} catch (error) {
		console.warn(
			"[addStreamInstance:warning] There's a little bit of error creating PM2 instance. But it doesn't matter because the stream will be created anyway."
		);
		console.warn(error);
		return true;
	}
}

export async function checkStreamInstance(path: string): Promise<boolean> {
	return await checkPM2Instance(path);
}

export async function getStreamInstance(
	path: string
): Promise<instance | null> {
	const lists = await listStreamInstance();
	const selectedInstance = lists?.find((list) => list.name === path);

	if (!selectedInstance) {
		return null;
	}

	return selectedInstance;
}

export async function deleteStreamInstance(
	path: string | string[]
): Promise<boolean> {
	let paths: string[];
	const faiiledPaths: string[] = [];
	let isSuccess: boolean = true;

	if (typeof path === 'string') {
		paths = [path];
	} else if (Array.isArray(path)) {
		paths = path;
	} else {
		return false;
	}

	for (const _path of paths) {
		const platform = getPlatformByPath(_path);

		if (platform === null) {
			continue;
		}

		await prisma.instance.upsert({
			where: {
				pathName: _path
			},
			update: {
				status: 'Deleting...'
			},
			create: {
				path: {
					connectOrCreate: {
						where: {
							name: _path
						},
						create: {
							name: _path,
							platform: platform
						}
					}
				},
				status: 'Deleting...'
			}
		});

		const isDeletePathSuccess = await destroyPM2Instance(_path);

		if (!isDeletePathSuccess) {
			isSuccess = false;
			faiiledPaths.push(_path);
		}
	}

	await redis.del(INSTANCE_CACHE_KEY);

	paths = paths.filter((_path) => !faiiledPaths.includes(_path));

	await prisma.instance.deleteMany({
		where: {
			pathName: {
				in: paths
			}
		}
	});
	return isSuccess;
}

export async function restartStreamInstance(
	path: string | string[]
): Promise<boolean> {
	let paths: string[];
	let isSuccess: boolean = true;

	if (typeof path === 'string') {
		paths = [path];
	} else if (Array.isArray(path)) {
		paths = path;
	} else {
		return false;
	}

	for (const _path of paths) {
		await updateInstanceStatus(_path, 'Update', 'Restarting');
		const isRestartPathSuccess = await restartPM2Instance(_path);
		if (!isRestartPathSuccess) {
			isSuccess = false;
		}
	}

	return isSuccess;
}

export async function updateInstanceState(
	name: string,
	lowLatency: boolean,
	recordId: string
): Promise<boolean> {
	const platform = getPlatformByPath(name);

	if (platform === null) {
		return false;
	}

	try {
		const instanceCount = await prisma.instance.count({
			where: {
				pathName: name
			}
		});

		if (!instanceCount || instanceCount > 1) {
			return false;
		}

		await prisma.$transaction([
			prisma.instance.updateMany({
				where: {
					pathName: name
				},
				data: {
					lowLatency: lowLatency
				}
			}),
			prisma.record.updateMany({
				where: {
					id: recordId
				},
				data: {
					instanceId: name
				}
			})
		]);
	} catch {
		console.error(`[updateInstanceStatus:error] Internal Server Error.`);
		return false;
	}
	await invalidateInstanceCache(name);
	return true;
}

export async function updateInstanceStatus(
	name: string,
	action: string,
	status: string
): Promise<boolean> {
	const platform = getPlatformByPath(name);

	if (platform === null) {
		return false;
	}

	try {
		switch (action) {
			case 'Update':
				await prisma.instance.upsert({
					where: {
						pathName: name
					},
					update: {
						status: status
					},
					create: {
						path: {
							connectOrCreate: {
								where: {
									name: name
								},
								create: {
									name: name,
									platform: platform
								}
							}
						},
						status: status
					}
				});
				break;
			case 'Delete':
				await prisma.instance.deleteMany({
					where: {
						pathName: name
					}
				});
				break;
			default:
				return false;
		}
	} catch (error) {
		if (error instanceof PrismaClientKnownRequestError) {
			console.error(
				`[updateInstanceStatus:error] The operation cannot proceed at this time. [DBError-${error.code}] (name=${name}, action=${action}, status=${status}).`
			);
		} else {
			console.error(
				`[updateInstanceStatus:error] Internal Server Error. (name=${name}, action=${action}, status=${status}).`
			);
		}
		return false;
	}
	await invalidateInstanceCache(name);
	return true;
}
