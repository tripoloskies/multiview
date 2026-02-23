<script>
    import { goto } from '$app/navigation';
    import { removePersistCommand, sendCommand, sendPersistCommand } from '$lib/bun/wsApi.svelte.js';
    import Button from '$lib/components/Button.svelte';
    import Viewer from '$lib/components/Viewer.svelte';
    import Multiview from '$lib/layouts/Multiview.svelte';
    import { resolve } from '$app/paths';
    import { onDestroy, onMount } from 'svelte';
	let { data, children } = $props();

	let serverMessage = $state("");
	let url = $state("");
	let online = $state(null);
	let status = $state("")

	let transactionId = $state("")
	onMount(async () => {
		transactionId = await sendPersistCommand("getStream", { path: data.path }, ({success, data}) => {
			if (!success) {
				removePersistCommand(transactionId)
				goto(resolve("/(view)/(multiview)"))
				return
			}
			const streamData = data
			url = streamData?.url
			online = streamData?.online
			status = streamData?.status
		})
	})

	onDestroy(() => {
		removePersistCommand(transactionId)
	})


</script>

<Multiview>
	<div class="contain">
		{#if url?.length > 0}
			{#if (children?.length > 0)}
				<div class="side-contain">
					{@render children()}
				</div>	
			{/if}
			<Viewer path={data.path} online={online || false} status={status}></Viewer>
		{/if}
	</div>
	
	{#snippet controls()}
		{#if online === true}
		<div class="controls">
			<div class="controls-items">
				<span>Controls</span>
				<span>
					<Button
						onclick={async () => {
							if (data.isCurrentPagePlay) {
								await goto(resolve("/(view)/(multiview)"));
							}
							else {
								await goto(resolve("/(view)/(singleview)/player/play/[...path]", { path: data?.path }));
							}
						}}>Back</Button
					>
					<Button
						onclick={async () => {
							await goto(resolve("/(view)/(singleview)/player/inspect/[...path]", { path: data?.path }));
						}}>Inspect</Button
					>
					<form onsubmit={async (event) => {
						event.preventDefault()
						if (!(event.target instanceof HTMLFormElement)) {
							return
						}
						const form = event.target;
						const formData = new FormData(form);
						const data = {...Object.fromEntries(formData.entries())}
						serverMessage = "Deleting stream..."
						const response = await sendCommand("deleteStream", data)

						if (!response.success) {
							serverMessage = response.message
							return
						}
						await goto(resolve("/(view)/(multiview)"));
					}}>
						<input type="hidden" name="path" value={data?.path} />
						<Button type="submit">Delete</Button>
					</form>
				</span>
			</div>
			<span class="status">
				<b>{serverMessage}</b>
			</span>
		</div>
		{/if}
	{/snippet}

</Multiview>

<style lang="postcss">
	@reference "tailwindcss";

	.contain {
		@apply flex-1 flex ;
	}
	.controls {
		@apply flex flex-row justify-between items-center text-white;
	}

	.controls-items {
		@apply flex flex-row items-center space-x-2;
	}

	.controls-items > span {
		@apply flex flex-row;
	}

	.status {
		@apply flex flex-row items-center;
	}
</style>
