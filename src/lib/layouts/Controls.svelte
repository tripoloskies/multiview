<script>
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
		@apply flex w-full justify-between flex-col md:flex-row;
	}
	.menu {
		@apply flex space-x-2;
	}

	:global(.menu > *) {
		@apply grow;
	}

	.stats {
		@apply bg-white flex items-center px-4 space-x-4 justify-between;
	}
</style>