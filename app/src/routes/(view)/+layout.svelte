<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { info, infoStart, talkStart } from '$lib/stores/info.svelte';
	import { end, start } from '$lib/api/websocket.svelte';

	let { data, children } = $props();

	onMount(async () => {
		start(data.wsRootUrl);
		talkStart();
		infoStart();
	});

	onDestroy(() => {
		end();
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
