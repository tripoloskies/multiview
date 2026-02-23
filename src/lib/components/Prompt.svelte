<script>
	import Button from './Button.svelte';
	import { goto } from '$app/navigation';
	let { children, header = null, returnUrl = '', footer = null } = $props();

	function close() {
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
		@apply flex w-3/4 flex-col space-y-2 rounded bg-white p-2;
	}
	.prompt-header {
		@apply flex w-full items-center justify-between;
	}
	.prompt-body {
		@apply relative flex w-full flex-col space-y-2;
	}
</style>
