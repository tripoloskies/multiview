import z from 'zod';

export const vodGetSchema = z.object({
	info: z.object({
		id: z.string().min(1),
		creatorName: z.string().min(1),
		metadataId: z.string().nullable(),
		manifestPath: z.string().min(1),
		datePublished: z.date()
	}),
	metadata: z
		.object({
			streamId: z.string(),
			title: z.string(),
			uploader: z.string(),
			dateUploaded: z.date(),
			webpageUrl: z.string(),
			description: z.string()
		})
		.nullable()
});

export type vodGetSchema = z.infer<typeof vodGetSchema>;

export const vodListSchema = z.object({
	id: z.string(),
	datePublished: z.date(),
	creator: z.object({
		name: z.string()
	})
});

export type vodListSchema = z.infer<typeof vodListSchema>;

export const vodListsSchema = z.object({
	count: z.number(),
	lists: z.array(vodListSchema)
});

export type vodListsSchema = z.infer<typeof vodListsSchema>;
