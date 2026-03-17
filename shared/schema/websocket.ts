import z from 'zod';
import { instanceSchema } from './instance';
import { controlApiPathsList } from './mediamtx';

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

export type streamEventResponseSchema = z.infer<typeof streamEventResponseSchema>;

export const getServerTimeResponseSchema = z.object({
	serverTime: z.string()
});

export type getServerTimeResponseSchema = z.infer<typeof getServerTimeResponseSchema>;

export const getStreamResponseSchema = z.object({
	status: z.string(),
	url: z.string(),
	online: z.boolean(),
	instance: instanceSchema
});

export type getStreamResponseSchema = z.infer<typeof getStreamResponseSchema>;

export const listActiveStreamsResponseSchema = z.object({
	paths: z.array(controlApiPathsList),
	instances: z.array(instanceSchema)
});

export type listActiveStreamsResponseSchema = z.infer<typeof listActiveStreamsResponseSchema>;

export const realtimeResponseSchema = listActiveStreamsResponseSchema.extend(
	getServerTimeResponseSchema.shape
);

export type realtimeResponseSchema = z.infer<typeof realtimeResponseSchema>;
