<script lang="ts">
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
		@apply flex h-screen flex-col overflow-x-hidden overflow-y-hidden bg-black;
	}

	#multiview-content {
		@apply flex flex-1 flex-col;
	}
</style>
