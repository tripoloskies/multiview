<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { state as playerState } from '$lib/stores/player.svelte';

	let { data } = $props();

	onMount(() => {
		playerState.isActionPageActive = true;
	});

	onDestroy(() => {
		playerState.isActionPageActive = false;
	});
</script>

<svelte:head>
	<title>"{data.path ?? 'Untitled'}" Chat | Multiview</title>
</svelte:head>

<h2>Chat</h2>
<div class="chat-content">
	{#if playerState.online && playerState.sourceId}
		{#if playerState.platform === 'youtube'}
			<iframe
				width="100%"
				height="100%"
				src={`https://www.youtube.com/live_chat?v=${playerState.sourceId}&embed_domain=${data.hostname}`}
				frameborder="0"
				title="Youtube Chat"
			></iframe>
		{:else if playerState.platform === 'twitch'}
			<iframe
				src={`https://www.twitch.tv/embed/${playerState.sourceId}/chat?parent=${data.hostname}`}
				height="100%"
				width="100%"
				frameborder="0"
				title="Twitch Chat"
			>
			</iframe>
		{:else}
			<h3>Unsupported Platform</h3>
		{/if}
	{:else}
		<h3>Offline</h3>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.chat-content {
		@apply h-full;
	}
</style>
