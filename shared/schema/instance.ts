import z from 'zod';

export const instanceSchema = z.object({
	name: z.string(),
	labelName: z.string(),
	active: z.boolean(),
	lowLatency: z.boolean(),
	platform: z.string(),
	streamSourceId: z.string().nullable(),
	online: z.boolean(),
	statusText: z.string(),
	mediaUrl: z.string().optional(),
	dateCreated: z.number()
});

export type instanceSchema = z.infer<typeof instanceSchema>;
