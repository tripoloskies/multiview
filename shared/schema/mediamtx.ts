import z from 'zod';

export const controlApiPathsList = z.object({
	name: z.string(),
	confName: z.string(),
	ready: z.boolean(),
	readyTime: z.string(),
	online: z.boolean(),
	onlineTime: z.string()
});

export type controlApiPathsList = z.infer<typeof controlApiPathsList>;

export const controlApiPathsResponse = z.object({
	pageCount: z.number(),
	itemCount: z.number(),
	items: z.array(controlApiPathsList)
});

export type controlApiPathsResponse = z.infer<typeof controlApiPathsResponse>;
