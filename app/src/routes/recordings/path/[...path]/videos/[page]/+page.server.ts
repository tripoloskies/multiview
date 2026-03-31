import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { apiResponseSchema } from '@shared/schema';
import type { recordListsSchema } from '@shared/schema/record';

export const load: PageServerLoad = async ({ params }) => {
	const path: string = params.path;
	const page: number = Number(params.page);
	const ITEMS_PER_PAGE = 9;

	if (isNaN(page)) {
		error(400, 'Bad Request. Please check if the page is a number or not.');
	} else if (page <= 0) {
		error(400, "Bad Request. There's no page 0 below!");
	}

	const response = await fetch(`http://localhost:3002/list/videos`, {
		method: 'POST',
		body: JSON.stringify({
			page: page,
			path: path,
			maxItems: ITEMS_PER_PAGE
		})
	});

	if (response.status !== 200) {
		error(500, `Internal Backend Server is down. ${response.status}`);
	}

	const responseData = (await response.json()) as apiResponseSchema;

	if (!responseData.success || !responseData.data) {
		error(500, 'Internal Backend Server is also down: ' + responseData.message);
	}

	const { count, lists } = responseData.data as recordListsSchema;

	if (!lists.length) {
		if (page === 1) {
			return {
				lists: []
			};
		} else {
			error(404, `No recordings found on page "${page}" from "${path}".`);
		}
	}

	const list = lists.map((list) => {
		const date = new Date(list.datePublished).toUTCString();
		return {
			id: list.id,
			title: date,
			author: list.path.name,
			thumbnail: `/api/recordings/fetch/${list.id}/thumbnail.jpg`,
			link: `/recordings/play/${list.id}`
		};
	});

	return {
		currentPage: page,
		itemCount: count,
		lists: list,
		totalPage: Math.ceil(count / ITEMS_PER_PAGE)
	};
};
