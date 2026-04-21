<script lang="ts">
	import { state as playerState } from '$lib/stores/player.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		playerState.isActionPageActive = false;
	});
</script>

<svelte:head>
	<title>{data?.path ?? 'Untitled'} | Multiview</title>
</svelte:head>
