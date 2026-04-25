import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		eventRootUrl: ``,
		wsRootUrl: `/ws`,
		hostname: locals.host,
		invalidateDataDuration: 2000,
		isHttps: locals.isHttps,
		isHostIp: locals.isHostIp
	};
};
