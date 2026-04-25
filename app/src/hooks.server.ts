import type { Handle } from '@sveltejs/kit';
import { v7 as randomUUIDv7 } from 'uuid';
import ipaddr from 'ipaddr.js';

export const handle: Handle = async ({ event, resolve }) => {
	const ipv6UrlBracket = /^\[|\]$/g;

	let sessionId: string | undefined = event.cookies.get('sessionId');
	const isHttps: boolean =
		event.request.headers.get('x-forwarded-proto') === 'https';

	if (!sessionId) {
		sessionId = randomUUIDv7();
		event.cookies.set('sessionId', sessionId, {
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
			sameSite: 'lax',
			secure: isHttps
		});
	}

	event.locals.isHttps = isHttps;
	event.locals.sessionId = sessionId;
	event.locals.host = event.url.hostname;
	event.locals.isHostIp = ipaddr.isValid(
		event.locals.host.replace(ipv6UrlBracket, '')
	);

	return resolve(event);
};
