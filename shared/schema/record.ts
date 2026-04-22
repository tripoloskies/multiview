import z from 'zod';

export const recordManifestType = z.enum(['hls']);

export type recordManifestType = z.infer<typeof recordManifestType>;

export const recordGetSchema = z.object({
	info: z.object({
		id: z.string().min(1),
		pathName: z.string().min(1),
		sourceMetadataId: z.string().nullable(),
		manifestPath: z.string().min(1),
		manifestUrl: z.string().min(1),
		manifestType: recordManifestType,
		datePublished: z.date()
	}),
	metadata: z
		.object({
			id: z.string(),
			uploaderId: z.string(),
			title: z.string(),
			uploader: z.string(),
			dateUploaded: z.date(),
			webpageUrl: z.string(),
			description: z.string()
		})
		.nullable()
});

export type recordGetSchema = z.infer<typeof recordGetSchema>;

export const recordGetPathSchema = z.object({
	name: z.string(),
	videoCount: z.number(),
	liveStatus: z.string()
});

export type recordGetPathSchema = z.infer<typeof recordGetPathSchema>;

export const recordListSchema = z.object({
	id: z.string(),
	datePublished: z.date(),
	path: z.object({
		name: z.string()
	})
});

export type recordListSchema = z.infer<typeof recordListSchema>;

export const recordListsSchema = z.object({
	count: z.number(),
	lists: z.array(recordListSchema)
});

export type recordListsSchema = z.infer<typeof recordListsSchema>;

export const recordListsPathSchema = z.object({
	lists: z.array(
		z.object({
			name: z.string(),
			items: z.number()
		})
	)
});

export type recordListsPathSchema = z.infer<typeof recordListsPathSchema>;

export const recordGetDiskStatus = z.enum([
	'ok',
	'low_space',
	'critical_low_space',
	'insufficient_min_size',
	'full',
	'error'
]);

export type recordGetDiskStatus = z.infer<typeof recordGetDiskStatus>;
