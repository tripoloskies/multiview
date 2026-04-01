<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		removePersistCommand,
		sendCommand,
		sendPersistCommand
	} from '$lib/api/websocket.svelte';
	import Viewer, {
		type ViewerIndicatorStatus
	} from '$lib/components/Viewer.svelte';
	import type { getStreamResponseSchema } from '@shared/schema/websocket';
	import Button from '$lib/components/Button.svelte';
	import Multiview from '$lib/layouts/Multiview.svelte';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import Controls from '$lib/layouts/Controls.svelte';
	import { info } from '$lib/stores/info.svelte.js';

	let { data, children } = $props();

	let serverMessage: string = $state('');
	let url: string = $state('');
	let online: boolean | null = $state(null);
	let status: string = $state('');
	let transactionId: string = $state('');
	let indicatorStatus: ViewerIndicatorStatus = $state('ok');
	let indicatorStatusText: string = $state('');

	onMount(async () => {
		transactionId = await sendPersistCommand({
			cmdName: 'getInstance',
			data: { path: data.path },
			callback: ({ success, data }) => {
				if (!success) {
					removePersistCommand(transactionId);
					goto(resolve('/(view)/(multiview)'));
					return;
				}
				const streamData = data as getStreamResponseSchema;

				url = streamData.mediaUrl || '';
				online = streamData.online;
				status = streamData.statusText;
			}
		});
		serverMessage = 'Ready';
	});

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
	onDestroy(() => {
		removePersistCommand(transactionId);
	});
</script>

<Multiview>
	<div class="contain">
		{#if url?.length > 0}
			{#if children?.length > 0}
				<div class="side-contain">
					{@render children()}
				</div>
			{/if}
			<Viewer
				path={data.path}
				online={online || false}
				{status}
				muted={false}
				visible={true}
				{indicatorStatus}
				{indicatorStatusText}
			></Viewer>
		{/if}
	</div>

	{#snippet controls()}
		<Controls>
			<Button
				onclick={async () => {
					if (data.isCurrentPagePlay) {
						await goto(resolve('/(view)/(multiview)'));
					} else {
						await goto(
							resolve('/(view)/(singleview)/player/play/[...path]', {
								path: data?.path
							})
						);
					}
				}}>Back</Button
			>
			<Button
				onclick={async () => {
					await goto(
						resolve('/(view)/(singleview)/player/inspect/[...path]', {
							path: data?.path
						})
					);
				}}>Inspect</Button
			>
			<form
				onsubmit={async (event) => {
					event.preventDefault();
					if (!(event.target instanceof HTMLFormElement)) {
						return;
					}
					const form = event.target;
					const formData = new FormData(form);
					const data = { ...Object.fromEntries(formData.entries()) };
					serverMessage = `Deleting "${data.path}"`;
					const response = await sendCommand('deleteInstance', data);

					if (!response.success) {
						serverMessage = response.message;
						return;
					}
					await goto(resolve('/(view)/(multiview)'));
				}}
			>
				<input type="hidden" name="path" value={data?.path} />
				<Button type="submit">Delete</Button>
			</form>
			<form
				onsubmit={async (event) => {
					event.preventDefault();
					if (!(event.target instanceof HTMLFormElement)) {
						return;
					}
					const form = event.target;
					const formData = new FormData(form);
					const data = { ...Object.fromEntries(formData.entries()) };
					serverMessage = `Restarting "${data.path}"`;
					const response = await sendCommand('restartInstance', data);

					if (!response.success) {
						serverMessage = response.message;
						return;
					}
					serverMessage = 'OK';
				}}
			>
				<input type="hidden" name="path" value={data?.path} />
				<Button type="submit">Restart</Button>
			</form>
			{#snippet footer()}
				<div>
					<b>Message: </b>
					<b>{serverMessage}</b>
				</div>
			{/snippet}
		</Controls>
	{/snippet}
</Multiview>

<style lang="postcss">
	@reference "tailwindcss";

	.contain {
		@apply flex flex-1 flex-col md:flex-row;
	}
</style>
