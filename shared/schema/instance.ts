import z from 'zod';

export const instanceSchema = z.object({
	name: z.string(),
	labelName: z.string(),
	active: z.boolean(),
	online: z.boolean(),
	statusText: z.string(),
	mediaUrl: z.string().optional()
});

export type instanceSchema = z.infer<typeof instanceSchema>;
