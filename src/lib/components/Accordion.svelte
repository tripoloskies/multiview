<script>
	let { open = false, header, children } = $props();

	let isOpen = $derived(open);
	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="accordion">
	<button onclick={toggle} class="path-accordion-header">
		{@render header()}
		<div class="accordion-indicator">
			<b><u>{isOpen ? 'Close' : 'Open'}</u></b>
		</div>
	</button>
	{#if isOpen}
		<div class="path-accordion-body">
			{@render children()}
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.accordion {
		@apply flex w-full flex-col;
	}

	.path-accordion-body {
		@apply flex flex-col;
	}

	.path-accordion-header {
		@apply flex w-full cursor-pointer items-center justify-between bg-neutral-600 px-2 py-2;
	}
</style>
