<script>

	import favicon from '$lib/assets/favicon.svg';
    import { onMount } from "svelte";
    import { start } from "$lib/bun/wsApi.svelte";
    import { load } from "$lib/stores/config.svelte";
	let { data, children } = $props();
	
	onMount(() => {
		start(`${data.host}:3000`)
		load()
	})
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}


<style lang="postcss">
	@import "@fontsource/ibm-plex-sans"; 
	@import "@fontsource/ibm-plex-sans/400.css"; 
	@import "@fontsource/ibm-plex-sans/400-italic.css"; 
	@import './layout.css';
</style>