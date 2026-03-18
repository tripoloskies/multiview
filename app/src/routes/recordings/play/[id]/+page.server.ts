import { redirect } from '@sveltejs/kit';
import z, { string } from 'zod';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { vodGetSchema } from '@shared/schema/vod';
import type { apiResponseSchema } from '@shared/schema';

export const load: PageServerLoad = async ({ params }) => {
	const query = {
		id: params.id
	};

	const schema = z.object({
		id: string().min(1)
	});

	try {
		const sanitizedQuery = await schema.parseAsync(query);

		const response = await fetch(
			`http://localhost:3002/get/${sanitizedQuery.id}`
		);

		if (response.status !== 200) {
			error(500, 'Internal Backend Server is down.');
		}

		const responseData = (await response.json()) as apiResponseSchema;

		if (!responseData.success || !responseData.data) {
			error(404, 'VOD does not exist');
		}

		const { info, metadata } = responseData.data as vodGetSchema;

		return {
			id: info.id,
			title: metadata?.title || new Date(info.datePublished).toUTCString(),
			mediaUrl: `/api/vod/fetch/${info.id}/index.m3u8`,
			webpageUrl: metadata?.webpageUrl,
			uploader: metadata?.uploader || info.creatorName,
			description: metadata?.description || 'None'
		};
	} catch (e) {
		if (e instanceof z.ZodError) {
			redirect(302, '/recordings');
		}
		throw e;
	}
};
