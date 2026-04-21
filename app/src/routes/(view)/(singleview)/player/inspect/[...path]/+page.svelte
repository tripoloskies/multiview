<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import { state as playerState } from '$lib/stores/player.svelte';
	let { data } = $props();
	let eventUrl: string = $state('');
	let customLog: string = $state('');

	onMount(() => {
		playerState.isActionPageActive = true;

		eventUrl = `${data.eventRootUrl}/events/log?path=${encodeURIComponent(data?.path)}`;
	});

	onDestroy(() => {
		playerState.isActionPageActive = true;
	});
</script>

<svelte:head>
	<title>Inspecting "{data.path ?? 'Untitled'}"" | Multiview</title>
</svelte:head>

<h2>Inspector</h2>
<div class="inspector-content">
	<ConsoleLog {eventUrl} {customLog}></ConsoleLog>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.inspector-content {
		@apply h-full;
	}
</style>
