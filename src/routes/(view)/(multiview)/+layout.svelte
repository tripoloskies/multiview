<script>
    import { removePersistCommand } from '$lib/bun/wsApi.svelte';
	import Viewer from '$lib/components/Viewer.svelte';
	import Multiview from '$lib/layouts/Multiview.svelte';
    import { config } from '$lib/stores/config.svelte';
    import { info, infoStart } from '$lib/stores/info.svelte.js';
    import { onDestroy, onMount } from 'svelte';

	let transactionId = $state("");

	let { children } = $props();
	
	onMount(async () => {
		transactionId = infoStart();
	});

	onDestroy(async() => {
		removePersistCommand(transactionId)
	})


	let sources = $derived(info.instances.map(instance => {
		const foundPath = info.paths.find(path => path.name == instance.name)
		return {
			name: instance.name,
			status: instance.status,
			online: foundPath ? true : false
		}
	}))

</script>

<Multiview>
	<div id="multiview-container">
		{#each sources as source (source.name)}
			<div class="item">
				<Viewer path={source?.name} muted={true} online={source?.online} visible={config.showVideoMultiView} status={source.status}></Viewer>
			</div>
		{/each}
	</div>
	{#snippet controls()}
		{@render children()}
	{/snippet}
</Multiview>

<style lang="postcss">
	@reference "tailwindcss";
	#multiview-container {
		@apply grid h-full w-full grow grid-rows-6 grid-cols-2 md:grid-rows-4 md:grid-cols-3 xl:grid-rows-3 xl:grid-cols-4;
	}

	.item {
		@apply border-2 border-white;
	}
</style>
