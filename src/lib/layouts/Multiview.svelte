<script>
	let { children, controls = null } = $props();
</script>

<div id="multiview">
	<div id="multiview-content">
		{@render children?.()}
	</div>
	<div id="controls">
		{@render controls?.()}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	#multiview {
		@apply h-screen flex flex-col bg-black overflow-x-hidden overflow-y-hidden;
	}

	#multiview-content {
		@apply flex-1 flex flex-col ;
	}
</style>
