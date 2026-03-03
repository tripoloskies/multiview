<script lang="ts">
	let { logs = [] } = $props();

	let component: HTMLElement | undefined = $state();

	$effect(() => {
		if (component && logs) {
			component.scrollTop = component.scrollHeight;
		}
	});
</script>

<code bind:this={component}>
	{#each logs as log}
		{log}
		<br />
	{/each}
</code>

<style lang="postcss">
	@reference "tailwindcss";
	code {
		@apply block h-64 w-full overflow-y-auto border-2 bg-blue-50 p-2 wrap-break-word text-black;
		overflow-anchor: auto;
	}
</style>
