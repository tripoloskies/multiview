<script>
	let { full = false, children } = $props();
</script>

<div class={full ? 'full' : ''}>
	{@render children?.()}
</div>

<style lang="postcss">
	@reference "tailwindcss";
	div {
		@apply container mx-auto flex flex-col space-y-2 pt-8;
	}
</style>
