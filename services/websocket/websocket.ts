import { actions as talk } from './api/talk';
import { actions as addStream } from './api/addStream';
import { actions as deleteStream } from './api/deleteStream';
import { actions as restartStream } from './api/restartStream';
import { actions as getServerTime } from './api/getServerTime';
import { actions as inspectStream } from './api/inspectStream';
import { actions as listActiveStream } from './api/listActiveStream';
import { actions as realtimeInfo } from './api/realtimeInfo';
import { actions as getStream } from './api/getStream';
import { wsMessageRequestSchema, wsMessageResponseSchema } from '@shared/schema/websocket';

const lists = [
	{ cmdName: 'talk', fn: talk },
	{ cmdName: 'addStream', fn: addStream },
	{ cmdName: 'deleteStream', fn: deleteStream },
	{ cmdName: 'restartStream', fn: restartStream },
	{ cmdName: 'inspectStream', fn: inspectStream },
	{ cmdName: 'getServerTime', fn: getServerTime },
	{ cmdName: 'listActiveStream', fn: listActiveStream },
	{ cmdName: 'realtimeInfo', fn: realtimeInfo },
	{ cmdName: 'getStream', fn: getStream }
];

const PERSIST_RATE_LIMIT: number = 10;
const PERSIST_REFRESH_DURATION: number = 500;

export const sockets: Bun.WebSocketHandler<undefined> = {
	open(ws) {
		console.log(`[Websocket]: Connection added.`);
		ws.sendText(
			JSON.stringify({
				success: true,
				message: 'Welcome to the portal. '
			})
		);
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
				console.error(`[Websocket]: Error. Missing response fields ${items.join(', ')}`);
				return;
			}

			ws.sendText(JSON.stringify(response.data));
		};

		// Prevents other message from sending junk to here.
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
			console.error(`[Websocket][${transactionId}]: Missing or bad fields: ${items.join(', ')}.`);

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
				console.log(
					`[Websocket][${transactionId}]: Persistent response activated. Command name: ${list.cmdName}, limit: ${PERSIST_RATE_LIMIT}`
				);
				for (let x = 1; x <= PERSIST_RATE_LIMIT; x++) {
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
				console.log(`[Websocket][${transactionId}]: Command name: ${list.cmdName}.`);
				send({
					...(await list.fn(newData.data)),
					transactionId: transactionId
				});
			}
		}
	}
};
