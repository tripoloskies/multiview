import z from 'zod';

export const apiResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.unknown().optional()
});

export type apiResponseSchema = z.infer<typeof apiResponseSchema>;
