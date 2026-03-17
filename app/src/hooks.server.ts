import type { Handle } from '@sveltejs/kit';
import { v7 as randomUUIDv7 } from 'uuid';

export const handle: Handle = async ({ event, resolve }) => {
	let sessionId: string | undefined = event.cookies.get('sessionId');
	const isHttps: boolean = event.url.protocol === 'https:';

	if (!sessionId) {
		sessionId = randomUUIDv7();
		event.cookies.set('sessionId', sessionId, {
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
			sameSite: 'lax',
			secure: isHttps
		});
	}

	event.locals.sessionId = sessionId;
	return resolve(event);
};
