<script>
	let { front = false, children } = $props();
</script>

<div class={front ? "top" : ""}>
	{@render children()}
</div>

<style lang="postcss">
	@reference "tailwindcss";
	div {
		@apply fixed top-0 left-0 flex h-full w-full items-center justify-center;
	}

	div.top {
		@apply z-50;
	}
</style>
