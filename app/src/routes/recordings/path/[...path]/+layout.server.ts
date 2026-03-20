import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { apiResponseSchema } from '@shared/schema';
import type { vodGetPathSchema } from '@shared/schema/vod';

export const load: LayoutServerLoad = async ({ params }) => {
	const path = params.path;
	const response = await fetch(
		`http://localhost:3002/get/path?name=${encodeURIComponent(path)}`
	);

	if (response.status !== 200) {
		error(500, `Internal Backend Server is down. ${response.status}`);
	}

	const responseData = (await response.json()) as apiResponseSchema;

	if (!responseData.success) {
		error(404, `Path "${path}" does not exist.`);
	}

	if (!responseData.data) {
		error(500, `Path '${path}" has no data.`);
	}

	const { name, videoCount, liveStatus } =
		responseData.data as vodGetPathSchema;

	return {
		pathInfo: {
			name,
			videoCount,
			liveStatus
		}
	};
};
