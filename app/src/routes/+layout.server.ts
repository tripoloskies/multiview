import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async () => {
	return {
		eventRootUrl: ``,
		wsRootUrl: `/ws`,
		invalidateDataDuration: 2000
	};
};
