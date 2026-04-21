<script lang="ts">
	let { floating = false, children, controls = null } = $props();
</script>

<div id="multiview">
	<div id="multiview-page">
		<div id="multiview-content">
			{@render children?.()}
		</div>
		<div id="controls" class={floating ? 'floating' : ''}>
			{@render controls?.()}
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	#multiview {
		@apply h-dvh w-dvw overflow-x-hidden overflow-y-auto;
	}

	#multiview-page {
		@apply flex min-h-screen flex-col;
	}

	#multiview-content {
		@apply flex grow;
	}
	#controls {
		@apply sticky bottom-0 left-0 z-30 bg-neutral-700;
	}
</style>
