import z from 'zod';
import { apiResponseSchema } from '@shared/schema';

type ApiResponse<T> = T extends z.ZodType
	? Omit<apiResponseSchema, 'data'> & { data: z.infer<T> }
	: Omit<apiResponseSchema, 'data'>;

export function JSONResponse<T extends z.ZodType | null>(
	schema: T | null,
	data: ApiResponse<T>
): Response {
	if (schema) {
		const apiResSchema = apiResponseSchema.extend({
			data: schema
		});

		return Response.json(apiResSchema.parse(data));
	}
	const apiResSchemaOverrideData = apiResponseSchema.extend({
		data: z.undefined().optional()
	});

	return Response.json(apiResSchemaOverrideData.parse(data));
}

export function wsResponse<T extends z.ZodType | null>(
	schema: T | null,
	data: ApiResponse<T>
): ApiResponse<T> {
	if (schema) {
		const apiResSchema = apiResponseSchema.extend({
			data: schema
		});

		return apiResSchema.parse(data) as ApiResponse<T>;
	} else {
		const apiResSchemaOverrideData = apiResponseSchema.omit({
			data: true
		});

		return apiResSchemaOverrideData.parse(data) as ApiResponse<T>;
	}
}
