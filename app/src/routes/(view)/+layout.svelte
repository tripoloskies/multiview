<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { info, infoStart, talkStart } from '$lib/stores/info.svelte';
	import { removePersistCommand, start } from '$lib/api/websocket.svelte';

	let { data, children } = $props();
	let talkTransactionId: string = $state('');
	let realtimeTransactionId: string = $state('');

	onMount(async () => {
		start(data.wsRootUrl);
		talkTransactionId = talkStart();
		realtimeTransactionId = infoStart();
	});

	onDestroy(() => {
		removePersistCommand(talkTransactionId);
		removePersistCommand(realtimeTransactionId);
	});
</script>

{#if info.isServerActive}
	{@render children()}
{:else}
	<div>
		<h1>
			Server is not active
			<br />
			Please wait...
		</h1>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	div {
		@apply flex h-screen w-screen items-center justify-center bg-black text-white;
	}
	h1 {
		@apply text-center;
	}
</style>
