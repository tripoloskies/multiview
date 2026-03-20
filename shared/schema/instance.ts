import z from 'zod';

export const instanceSchema = z.object({
	name: z.string(),
	labelName: z.string(),
	active: z.boolean(),
	status: z.string().optional()
});

export type instanceSchema = z.infer<typeof instanceSchema>;
