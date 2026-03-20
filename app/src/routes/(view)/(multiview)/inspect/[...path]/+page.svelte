<script lang="ts">
	import { resolve } from '$app/paths';
	import { sendCommand } from '$lib/api/websocket.svelte';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { info } from '$lib/stores/info.svelte.js';
	import type { streamEventResponseSchema } from '@shared/schema/websocket';
	import { onMount } from 'svelte';

	let { data } = $props();

	let isReady: boolean = $state(false);
	let eventSrc: string = $state('');
	let customLog: string = $state('');

	onMount(async () => {
		isReady = true;
		if (data.path.length) {
			execute(data.path);
		}
	});

	async function execute(pathName: string) {
		const response = await sendCommand('inspectStream', {
			path: pathName
		});

		customLog = response.message;

		if (!response.success) {
			return;
		}

		const { eventUrl } = response.data as streamEventResponseSchema;

		if (!eventUrl?.length) {
			customLog = "No event URL? There's something wrong with the server.";
			return;
		}

		eventSrc = `${data.eventRootUrl}${eventUrl}`;
	}
</script>

<svelte:head>
	<title>Inspect Stream - Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve('/(view)/(multiview)')}>
			{#snippet header()}
				<h2>Inspector</h2>
			{/snippet}
			{#if info.instances.length}
				<form
					onsubmit={async (event) => {
						event.preventDefault();
						if (!(event.target instanceof HTMLFormElement)) {
							return;
						}
						const form = event.target;
						const formData = new FormData(form);
						const data = Object.fromEntries(formData.entries());
						execute(data.path);
					}}
				>
					<div id="inspect-field">
						<label for="path">Path Name</label>
						<select name="path" class="w-full">
							{#each info.instances as list (list.name)}
								<option value={list?.name}>{list?.labelName}</option>
							{/each}
						</select>
					</div>
					<Button type="submit" disabled={!isReady}>Inspect</Button>
				</form>
				<hr />
				<ConsoleLog eventUrl={eventSrc} {customLog} />
			{:else}
				<hr />
				<b>There's no instances left.</b>
			{/if}
		</Prompt>
	</Subcontainer>
</Container>

<style lang="postcss">
	@reference "tailwindcss";

	form {
		@apply flex justify-between space-x-4;
	}

	#inspect-field {
		@apply flex w-full space-x-4;
	}

	#inspect-field > *:first-child {
		@apply grow;
	}
</style>
