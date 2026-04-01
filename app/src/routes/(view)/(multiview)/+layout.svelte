<script lang="ts">
	import { selectToAction, viewState } from '$lib/stores/multiview.svelte';
	import Viewer, {
		type ViewerIndicatorStatus
	} from '$lib/components/Viewer.svelte';
	import Multiview from '$lib/layouts/Multiview.svelte';
	import { config } from '$lib/stores/config.svelte';
	import { info } from '$lib/stores/info.svelte';
	import Button from '$lib/components/Button.svelte';

	let { children } = $props();

	let indicatorStatus: ViewerIndicatorStatus = $state('ok');
	let indicatorStatusText: string = $state('');

	$effect(() => {
		switch (info.diskStatus) {
			case 'ok':
				indicatorStatus = 'ok';
				indicatorStatusText = '';
				break;
			case 'low_space':
				indicatorStatus = 'warning';
				indicatorStatusText = 'Disk Low Space';
				break;
			case 'full':
				indicatorStatus = 'danger';
				indicatorStatusText = 'Disk Full';
				break;
			case 'critical_low_space':
				indicatorStatus = 'danger';
				indicatorStatusText = 'Disk Critically Low';
				break;
		}
	});
</script>

<Multiview>
	<div id="multiview-container">
		{#each info.instances as instance (instance.name)}
			<div class="item">
				{#if viewState.action !== 'none'}
					<div class="item-overlay">
						<Button onclick={() => selectToAction(instance.name)}
							>{viewState.action.toUpperCase()}?</Button
						>
					</div>
				{/if}
				<Viewer
					path={instance.name}
					muted={true}
					online={instance.online}
					visible={config.showVideoMultiView}
					status={instance.statusText}
					{indicatorStatus}
					{indicatorStatusText}
				></Viewer>
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
		@apply grid h-full w-full grow grid-cols-2 grid-rows-8 md:grid-cols-4 md:grid-rows-4 xl:grid-cols-4 xl:grid-rows-4;
	}

	.item {
		@apply relative border-2 border-white;
	}

	.item-overlay {
		@apply absolute z-20 flex h-full w-full items-center justify-center;
	}
</style>
