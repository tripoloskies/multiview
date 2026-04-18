import { toastStore } from '$lib/stores/toast.svelte';
import type { apiResponseSchema } from '@shared/schema';

export const state = $state({
	running: false
});

export async function deleteRecording(id: string): Promise<boolean> {
	state.running = true;
	try {
		toastStore.message = `Deleting Record ID ${id}...`;
		const response = await fetch(
			`/api/recordings/delete/${encodeURIComponent(id)}`,
			{
				method: 'POST'
			}
		);

		if (response.status !== 200) {
			toastStore.message = `Internal Backend Server is down. ${response.status}`;
			return false;
		}

		const responseData = (await response.json()) as apiResponseSchema;
		toastStore.message = responseData.message;

		if (!responseData.success) {
			return false;
		}

		return true;
	} catch {
		toastStore.message = 'Internal Server Error';
		return false;
	} finally {
		state.running = false;
	}
}
