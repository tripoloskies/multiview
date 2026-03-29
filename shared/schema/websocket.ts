import z from 'zod';
import { instanceSchema } from './instance';

export const wsMessageRequestSchema = z.object({
	cmdName: z.string(),
	transactionId: z.string().min(6),
	persist: z.boolean(),
	finished: z.boolean().optional(),
	data: z.record(z.string(), z.unknown()).optional()
});

export type wsMessageRequestSchema = z.infer<typeof wsMessageRequestSchema>;

export const wsMessageResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	finished: z.boolean().optional(),
	transactionId: z.string(),
	data: z.record(z.string(), z.unknown()).optional()
});

export type wsMessageResponseSchema = z.infer<typeof wsMessageResponseSchema>;

export const streamEventResponseSchema = z.object({
	eventUrl: z.string()
});

export type streamEventResponseSchema = z.infer<
	typeof streamEventResponseSchema
>;

export const getServerTimeResponseSchema = z.object({
	serverTime: z.string()
});

export type getServerTimeResponseSchema = z.infer<
	typeof getServerTimeResponseSchema
>;

export const getStreamResponseSchema = instanceSchema;

export type getStreamResponseSchema = z.infer<typeof getStreamResponseSchema>;

export const listInstancesResponseSchema = z.object({
	instances: z.array(instanceSchema)
});

export type listInstancesResponseSchema = z.infer<
	typeof listInstancesResponseSchema
>;

export const realtimeResponseSchema = listInstancesResponseSchema.extend(
	getServerTimeResponseSchema.shape
);

export type realtimeResponseSchema = z.infer<typeof realtimeResponseSchema>;
