<script lang="ts">
	import { onMount } from 'svelte';
	import { load } from '$lib/stores/config.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	onMount(() => {
		load();
	});
</script>

{@render children()}
<Toast />

<style lang="postcss">
	@import '@fontsource/ibm-plex-sans';
	@import '@fontsource/ibm-plex-sans/400.css';
	@import '@fontsource/ibm-plex-sans/400-italic.css';
	@import './layout.css';
</style>
