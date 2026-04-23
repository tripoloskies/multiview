<script lang="ts">
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	let { children, header = null, returnUrl = '', footer = null } = $props();

	function close(): void {
		if (returnUrl.length) {
			goto(returnUrl);
		} else {
			window.history.back();
		}
	}
</script>

<div class="prompt">
	<div class="prompt-header">
		<div>
			{@render header?.()}
		</div>
		<div>
			<Button onclick={close}>Close</Button>
		</div>
	</div>
	<div class="prompt-body">
		{@render children()}
	</div>
	<div class="prompt-footer">
		{@render footer?.()}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.prompt {
		@apply mx-4 flex max-h-[90%] w-full flex-col space-y-2 rounded bg-white p-2 text-black lg:mx-0 lg:w-3/4;
	}
	.prompt-header {
		@apply flex w-full items-center justify-between;
	}
	.prompt-body {
		@apply relative flex w-full grow flex-col space-y-2;
	}
</style>
