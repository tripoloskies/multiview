import z from 'zod';

export const ytdlpMetadataSchema = z.object({
	id: z.string().min(1),
	fulltitle: z.string().min(1),
	uploader: z.string().min(1),
	timestamp: z.number(),
	description: z.string().min(1),
	extractor: z.string().min(1),
	webpage_url: z.string().min(1)
});

export type ytdlpMetadataSchema = z.infer<typeof ytdlpMetadataSchema>;
