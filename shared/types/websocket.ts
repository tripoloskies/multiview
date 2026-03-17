export type apiResponse = {
	success: boolean;
	message: string;
	data?: Record<string, unknown>;
};

export type wsActions = (data?: Record<string, unknown>) => Promise<apiResponse>;
