<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { info, talkStart } from '$lib/stores/info.svelte';
	import { removePersistCommand, start } from '$lib/api/websocket.svelte';
	let { data, children } = $props();
	let transactionId: string = $state('');
	onMount(async () => {
		start(data.wsRootUrl);
		transactionId = talkStart();
	});

	onDestroy(async () => {
		removePersistCommand(transactionId);
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
