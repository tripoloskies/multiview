import {
	controlApiPathsList,
	controlApiPathsResponse
} from '@shared/schema/mediamtx';
import { redis } from 'bun';

const STREAM_CACHE_KEY: string = 'streaming';
const STREAM_CACHE_EXPIRE: number = 1;
const STREAMLIST_CACHE_KEY: string = 'instance:controlapi';
const STREAMLIST_CACHE_EXPIRE: number = 2;

export async function getPathList(
	name: string
): Promise<controlApiPathsList | null> {
	let items: controlApiPathsList[];

	const fetchRequest = async (): Promise<controlApiPathsList[]> => {
		const response = await fetch(
			`http://${Bun.env.STREAMING_HOST}:9997/v3/paths/list`
		);

		if (response.status !== 200) {
			return [];
		}

		const { data, success } = await controlApiPathsResponse.safeParseAsync(
			await response.json()
		);

		if (!success) {
			return [];
		}

		await redis.set(
			STREAMLIST_CACHE_KEY,
			JSON.stringify(data.items),
			'EX',
			STREAMLIST_CACHE_EXPIRE + 2
		);

		return data.items;
	};

	if ((await redis.ttl(STREAMLIST_CACHE_KEY)) > 2) {
		const cachedResult = await redis.get(STREAMLIST_CACHE_KEY);

		if (cachedResult) {
			items = JSON.parse(cachedResult);
		} else {
			items = await fetchRequest();
		}
	} else {
		items = await fetchRequest();
	}

	if (!items.length) {
		return null;
	}

	return items.find((item) => item.name === name) || null;
}

export async function isStreamingAlive(): Promise<boolean> {
	let isAlive: boolean;
	try {
		if ((await redis.ttl(STREAM_CACHE_KEY)) >= 2) {
			const cachedResult = await redis.get(STREAM_CACHE_KEY);
			if (cachedResult) {
				const cachedData = await JSON.parse(cachedResult);

				if (typeof cachedData === 'boolean') {
					return cachedData;
				}
			}
		}

		const request = await fetch(
			`http://${Bun.env.STREAMING_HOST}:9997/v3/info`
		);

		isAlive = request.status === 200;
	} catch {
		isAlive = false;
	}
	await redis.set(
		STREAM_CACHE_KEY,
		JSON.stringify(isAlive),
		'EX',
		STREAM_CACHE_EXPIRE + 2
	);
	return isAlive;
}
