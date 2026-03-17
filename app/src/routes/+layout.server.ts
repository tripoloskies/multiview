import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	return {
		rootUrl: `${url.protocol}//${locals.host}`,
		eventRootUrl: ``,
		wsRootUrl: `/ws`
	};
};
