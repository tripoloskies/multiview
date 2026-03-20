import type { apiResponseSchema } from '@shared/schema';
import type { vodListsPathSchema } from '@shared/schema/vod';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async () => {
	const DEFAULT_PAGE: number = 1;
	const MAX_ITEMS: number = 50;

	const response = await fetch(`http://localhost:3002/list/paths`, {
		method: 'POST',
		body: JSON.stringify({
			page: DEFAULT_PAGE,
			maxItems: MAX_ITEMS
		})
	});

	if (response.status !== 200) {
		error(500, `Internal Backend Server is down. ${response.status}`);
	}

	const responseData = (await response.json()) as apiResponseSchema;

	if (!responseData.success || !responseData.data) {
		error(500, 'Internal Backend Server is also down: ' + responseData.message);
	}

	const paths = responseData.data as vodListsPathSchema;

	return {
		paths: paths.lists
	};
};
