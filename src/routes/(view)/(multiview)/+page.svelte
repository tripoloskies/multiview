<script>

	import Button from '$lib/components/Button.svelte';
	import Menu from '$lib/components/Menu.svelte';
    import { info } from '$lib/stores/info.svelte';
	
	let isMainMenuOpen = $state(false);
	let activePaths = $derived(info.paths.filter((path) => path?.online)?.length);

</script>

<svelte:head>
	<title>Multiview</title>
</svelte:head>

<div class="main-menu">
	{#if isMainMenuOpen}
		<Menu title="Main Menu">
			<Button type="link" link="/add">Add</Button>
			<Button type="link" link="/inspect">Inspect</Button>
			<Button type="link" link="/delete">Delete</Button>
			<Button type="link" link="/settings">Settings</Button>
			<Button type="link" link="/recordings">Recordings</Button>
		</Menu>
	{/if}
	<Button onclick={() => (isMainMenuOpen = !isMainMenuOpen)}>Menu</Button>
</div>

<div class="stats-view">
	<span><b>Active Streams:</b> {activePaths}</span> |
	<span><b>{info.serverTime}</b></span>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.main-menu {
		@apply absolute bottom-0;
	}

	.stats-view {
		@apply absolute right-0 bottom-0 bg-white p-2;
	}
</style>
