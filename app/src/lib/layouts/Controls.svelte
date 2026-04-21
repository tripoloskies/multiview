<script lang="ts">
	let { children, footer } = $props();
</script>

<div class="controls">
	<div class="menu">
		{@render children()}
	</div>
	<div class="stats">
		{@render footer?.()}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.controls {
		@apply flex w-full flex-col justify-between space-y-4 px-4 py-3 lg:flex-row lg:items-center lg:space-y-0 lg:p-0;
	}
	.menu {
		@apply flex space-x-2;
	}

	:global(.menu > *) {
		@apply grow;
	}
</style>
