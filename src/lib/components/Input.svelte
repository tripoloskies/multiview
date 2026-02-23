<script>
	let { name = '', placeholder = '', value = $bindable() } = $props();
</script>

<input type="text" {name} {placeholder} bind:value />

<style lang="postcss">
	@reference "tailwindcss";
	input {
		@apply rounded-xl border-2;
	}
</style>
