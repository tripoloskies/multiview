<script lang="ts">
	let { children } = $props();
</script>

<div class="video-card-container">
	{@render children()}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.video-card-container {
		@apply grid grid-cols-1 gap-4 lg:grid-cols-3;
	}
</style>
