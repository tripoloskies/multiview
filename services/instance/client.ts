import { $ } from 'bun';
import pm2 from 'pm2';
import { type instanceSchema } from '@shared/schema/instance';
let isConnected: boolean = false;

type instance = instanceSchema;

const INTERNAL_REGEX: RegExp = /^internal:\S*$/;

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
	try {
		const lists = await pm2List();

		for (const list of lists) {
			if (!list?.name) {
				continue;
			}
			if (list.pm2_env?.status === 'stopped') {
				await pm2Delete(list.name);
			}
		}
		return true;
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

export async function listStreamInstance(): Promise<instance[]> {
	const newLists: instance[] = [];
	try {
		const lists = await listPM2Instance();
		if (lists?.length) {
			for (const list of lists) {
				if (!list?.name?.length) {
					continue;
				}
				newLists.push({
					name: list.name,
					labelName: `${list.name} ${list?.pm2_env?.status}`,
					active: list?.pm2_env?.status !== 'stopped'
				});
			}
		}
	} catch {
		return [];
	}
	return newLists;
}

export async function deleteStoppedInstances(): Promise<boolean> {
	return await destroyStoppedPM2Instance();
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
		return await createPM2Instance({
			name: streamPath,
			script: `bash ./workers/streamCreate.sh "${url}" "${streamPath}" ${Bun.env.RECORD_PATH || ''} "${bunExecutablePath}" "${ytdlpExecutablePath}" "${streamlinkExecutablePath}" ${Bun.env.MEDIAMTX_HOST || ''}`,
			autorestart: false
		});
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
	const lists = await listPM2Instance();

	const selectedInstance = lists?.find((list) => list.name === streamPath);

	if (!selectedInstance || !selectedInstance.name?.length) {
		return null;
	}

	return {
		name: selectedInstance.name,
		labelName: `${selectedInstance.name} ${selectedInstance?.pm2_env?.status}`,
		active: selectedInstance?.pm2_env?.status !== 'stopped'
	};
}

export async function deleteStreamInstance(
	streamPath: string
): Promise<boolean> {
	return await destroyPM2Instance(streamPath);
}

export async function restartStreamInstance(
	streamPath: string
): Promise<boolean> {
	return await restartPM2Instance(streamPath);
}
