<script>
	let { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style lang="postcss">
	@reference "tailwindcss";
	div {
		@apply fixed top-0 left-0 flex h-full w-full items-center justify-center;
	}
</style>
