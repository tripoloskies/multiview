import { sockets } from './websocket';

const _server = Bun.serve({
	fetch(request, server) {
		const cookies = request.headers.get('cookie');

		if (!cookies?.length) {
			console.error(`[Websocket]: No Cookies. Stopping.`);
			return new Response('Request not allowed!');
		}

		const success = server.upgrade(request);

		if (success) {
			console.log(`[Websocket]: Upgrade success.`);
			return undefined;
		}

		console.error(`[Websocket]: Upgrade failed. Stopping.`);
		return new Response('Request not allowed!');
	},
	port: 3000,
	websocket: sockets
});

console.log(`Websocket Service: Listening ${_server.hostname}:${_server.port}`);
