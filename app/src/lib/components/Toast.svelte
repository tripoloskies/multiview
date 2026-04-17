<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';

	const TOAST_VISIBLE_TIMEOUT = 5000;
	let timeoutHandler: NodeJS.Timeout | undefined = $state();
	let toastMessage = $state('');

	$effect(() => {
		if (toastMessage === toastStore.message) {
			return;
		}
		toastMessage = toastStore.message;

		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = undefined;
		}

		if (!toastMessage.length) {
			clear();
		} else {
			timeoutHandler = setTimeout(clear, TOAST_VISIBLE_TIMEOUT);
		}
	});

	function clear() {
		if (timeoutHandler) {
			clearTimeout(timeoutHandler);
			timeoutHandler = undefined;
		}
		toastStore.message = '';
	}
</script>

{#if toastMessage.length > 0}
	<div class="toast-container">
		<div class="toast">
			<div class="toast-message-container">
				<b>{toastMessage}</b>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";

	.toast-container {
		@apply fixed bottom-0 z-50 mb-9 flex w-full justify-center text-white;
	}

	.toast {
		@apply bg-neutral-700 px-4 py-2;
	}
</style>
