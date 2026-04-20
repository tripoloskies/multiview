import { SvelteMap } from 'svelte/reactivity';
import { v4 as uuidv4 } from 'uuid';
import type { wsMessageResponseSchema } from '@shared/schema/websocket';
import { apiResponseSchema } from '@shared/schema';

export type wsApiPersistOptions = {
	cmdName: string;
	data: Record<string, unknown>;
	callback: (result: apiResponseSchema) => void;
};

const persistIds: SvelteMap<string, wsApiPersistOptions> = new SvelteMap();

let socket: WebSocket;
let isStared: boolean = $state(false);
let isFirstTime: boolean = $state(true);
let timeoutId: NodeJS.Timeout;

export function start(hostUrl: string): void {
	socket = new WebSocket(hostUrl);
	isStared = true;
	socket.onopen = () => {
		clearTimeout(timeoutId);
		if (!isFirstTime) {
			for (const [key, data] of persistIds) {
				_sendCommand(data.cmdName, key, true, data.data);
			}
		} else {
			isFirstTime = false;
		}
	};

	socket.onmessage = async (message) => {
		for (const [transactionId, props] of persistIds) {
			const data = JSON.parse(message.data) as wsMessageResponseSchema;
			if (transactionId !== data.transactionId) {
				continue;
			}
			props.callback({
				success: data.success,
				message: data.message,
				data: data?.data
			});

			if (data.finished) {
				await _sendCommand(props.cmdName, transactionId, true, props.data);
			}
		}
	};

	socket.onerror = () => {
		console.error('Websocket client error detected! Restarting....');
		timeoutId = setTimeout(() => {
			start(hostUrl);
		}, 500);
	};

	socket.onclose = () => {
		if (isStared) {
			timeoutId = setTimeout(() => {
				start(hostUrl);
			}, 500);
		}
	};
}

export function end() {
	isFirstTime = true;
	persistIds.clear();
	isStared = false;
	if (socket && socket.OPEN) {
		socket.close();
	}
}

function isReady(): Promise<boolean> {
	return new Promise((resolve) => {
		if (!socket) {
			resolve(false);
			return;
		}
		const x = setInterval(() => {
			if (socket.readyState == socket.OPEN) {
				clearInterval(x);
				resolve(true);
			}
		}, 100);
	});
}

async function _sendCommand(
	cmdName: string,
	transactionId: string,
	persist: boolean = false,
	data?: Record<string, unknown>
): Promise<apiResponseSchema> {
	await isReady();
	return new Promise((resolve) => {
		function func(event: MessageEvent) {
			const result: wsMessageResponseSchema = JSON.parse(event.data);
			const resultTransactionId = result?.transactionId;
			if (
				!result?.transactionId?.length ||
				resultTransactionId != transactionId
			) {
				return;
			}

			socket.removeEventListener('message', func);

			resolve(result);
		}

		try {
			if (!persist) {
				socket.addEventListener('message', func);
			}
			socket.send(
				JSON.stringify({
					cmdName: cmdName,
					persist: persist,
					transactionId: transactionId,
					data: data
				})
			);
		} catch {
			console.warn("I don't care, just continue.");
		}
	});
}

export function sendCommand(
	cmdName: string,
	data?: Record<string, unknown>
): Promise<apiResponseSchema> {
	const transactionId: string = uuidv4();
	return _sendCommand(cmdName, transactionId, false, data);
}

export function sendPersistCommand(options: wsApiPersistOptions): string {
	const transactionId: string = uuidv4();
	persistIds.set(transactionId, {
		cmdName: options.cmdName,
		data: options.data,
		callback: options.callback
	});
	_sendCommand(options.cmdName, transactionId, true, options.data);

	return transactionId;
}

export function removePersistCommand(transactionId: string): void {
	persistIds.delete(transactionId);
}
