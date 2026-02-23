<script>
	let { title, children } = $props();
</script>

<div class="menu">
	<div class="menu-header">
		<h2>{title}</h2>
	</div>
	<hr />
	<div class="menu-body">
		{@render children()}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.menu {
		@apply w-64 space-y-2 bg-white p-2;
	}
	.menu-body {
		@apply space-y-2;
	}
</style>
