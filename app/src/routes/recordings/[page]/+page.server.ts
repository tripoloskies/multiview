import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { vodListsSchema } from '@shared/schema/vod';
import type { apiResponseSchema } from '@shared/schema';
export const load: PageServerLoad = async ({ params }) => {
	const page = Number(params.page);
	const visiblePages = [];
	const ITEMS_PER_PAGE = 9;
	const VISIBLE_PAGE_LIMIT = 4;

	if (isNaN(page)) {
		error(400, 'Bad Request. Please check if the page is a number or not.');
	} else if (page <= 0) {
		error(400, "Bad Request. There's no page 0 below!");
	}

	const response = await fetch(`http://localhost:3002/list/videos`, {
		method: 'POST',
		body: JSON.stringify({
			page: page,
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

	const { count, lists } = responseData.data as vodListsSchema;

	if (!lists.length) {
		error(404, `No recordings found on page "${page}".`);
	}

	const pageCount = Math.ceil(count / ITEMS_PER_PAGE);

	if (page <= VISIBLE_PAGE_LIMIT - 2) {
		for (let x = 1; x <= VISIBLE_PAGE_LIMIT; x++) {
			if (x > pageCount) {
				break;
			}
			visiblePages.push(x);
		}
	} else {
		if (pageCount - page < 2) {
			for (let x = pageCount - VISIBLE_PAGE_LIMIT; x <= pageCount; x++) {
				if (x <= 0) continue;
				visiblePages.push(x);
			}
		} else {
			for (let x = page - 2; x <= page + 2; x++) {
				if (x > pageCount) {
					break;
				}
				visiblePages.push(x);
			}
		}
	}

	const list = lists.map((list) => {
		const date = new Date(list.datePublished).toUTCString();
		return {
			id: list.id,
			title: date,
			author: list.creator.name,
			thumbnail: `/api/vod/fetch/${list.id}/thumbnail.jpg`,
			link: `/recordings/play/${list.id}`
		};
	});
	return {
		visiblePages: visiblePages,
		currentPage: page,
		pageCount: pageCount,
		pageLimit: VISIBLE_PAGE_LIMIT,
		itemCount: count,
		lists: list
	};
};
