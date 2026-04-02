import { actions as talk } from './actions/talk';
import { actions as createInstance } from './actions/createInstance';
import { actions as deleteInstance } from './actions/deleteInstance';
import { actions as restartInstance } from './actions/restartInstance';
import { actions as getServerTime } from './actions/getServerTime';
import { actions as inspectInstance } from './actions/inspectInstance';
import { actions as listInstance } from './actions/listInstance';
import { actions as realtimeInfo } from './actions/realtimeInfo';
import { actions as getInstance } from './actions/getInstance';
import {
	wsMessageRequestSchema,
	wsMessageResponseSchema
} from '@shared/schema/websocket';
import type { wsData } from '@shared/types/websocket';
import { redis } from 'bun';

const lists = [
	{ cmdName: 'talk', fn: talk },
	{ cmdName: 'createInstance', fn: createInstance },
	{ cmdName: 'deleteInstance', fn: deleteInstance },
	{ cmdName: 'restartInstance', fn: restartInstance },
	{ cmdName: 'inspectStream', fn: inspectInstance },
	{ cmdName: 'getServerTime', fn: getServerTime },
	{ cmdName: 'listInstance', fn: listInstance },
	{ cmdName: 'realtimeInfo', fn: realtimeInfo },
	{ cmdName: 'getInstance', fn: getInstance }
];

const PERSIST_RATE_LIMIT: number = 10;
const PERSIST_REFRESH_DURATION: number = 500;

export const sockets: Bun.WebSocketHandler<wsData> = {
	async open(ws) {
		console.log(`[Websocket]: Connection added.`);
		ws.sendText(
			JSON.stringify({
				success: true,
				message: 'Welcome to the portal. '
			})
		);
		if (await redis.exists(ws.data.cacheKey)) {
			await redis.del(ws.data.cacheKey);
		}
	},

	async close(ws) {
		if (await redis.exists(ws.data.cacheKey)) {
			await redis.del(ws.data.cacheKey);
		}
	},

	// this is called when a message is received
	async message(ws, message) {
		let transactionId: string = '';
		const send = (data: wsMessageResponseSchema) => {
			const response = wsMessageResponseSchema.safeParse(data);

			if (!response.success) {
				const items: PropertyKey[] = [];
				for (const issue of response.error.issues) {
					items.push(...issue.path);
				}
				console.error(
					`[Websocket]: Error. Missing response fields ${items.join(', ')}`
				);
				return;
			}

			ws.sendText(JSON.stringify(response.data));
		};

		// Prevents other message from sending junk here.
		if (typeof message !== 'string') {
			console.error(`[Websocket][${transactionId}]: Invalid request format.`);
			send({
				success: false,
				message: 'Invalid data format. Use JSON.',
				transactionId: transactionId
			});
			return;
		}

		const data = JSON.parse(message);

		transactionId = data?.transactionId || '';

		const result = await wsMessageRequestSchema.safeParseAsync(data);

		if (!result.success) {
			const items = [];

			for (const issue of result.error.issues) {
				items.push(...issue.path);
			}
			console.error(
				`[Websocket][${transactionId}]: Missing or bad fields: ${items.join(', ')}.`
			);

			send({
				success: false,
				transactionId: transactionId,
				message: `Incomplete or bad fields. ${items.join(', ')}`
			});

			return;
		}

		const newData = result.data;
		transactionId = newData.transactionId;

		for (const list of lists) {
			if (list.cmdName != newData.cmdName) {
				continue;
			}

			if (newData.persist) {
				if (await redis.hexists(ws.data.cacheKey, transactionId)) {
					console.log(
						`[Websocket][${transactionId}]: Duplicate Persistent request. Transaction ID: ${transactionId}`
					);
					break;
				}
				console.log(
					`[Websocket][${transactionId}]: Persistent response activated. Command name: ${list.cmdName}, limit: ${PERSIST_RATE_LIMIT}`
				);

				await redis.hset(ws.data.cacheKey, transactionId, list.cmdName);

				for (let x = 1; x <= PERSIST_RATE_LIMIT; x++) {
					if (x == PERSIST_RATE_LIMIT) {
						await redis.hdel(ws.data.cacheKey, transactionId);
					}
					const _data = {
						...(await list.fn(newData.data)),
						finished: x == PERSIST_RATE_LIMIT
					};
					send({
						..._data,
						transactionId: transactionId
					});
					await Bun.sleep(PERSIST_REFRESH_DURATION);
				}
			} else {
				console.log(
					`[Websocket][${transactionId}]: Command name: ${list.cmdName}.`
				);
				send({
					...(await list.fn(newData.data)),
					transactionId: transactionId
				});
			}
		}
	}
};
