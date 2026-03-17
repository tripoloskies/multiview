<script lang="ts">
	import { resolve } from '$app/paths';
	import { sendCommand } from '$lib/api/websocket.svelte';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { streamEventResponseSchema } from '@shared/schema/websocket.js';
	import { onMount } from 'svelte';

	let { data } = $props();
	let isStreamCreated: boolean = $state(false);
	let targetInput: HTMLInputElement | undefined = $state();
	let eventSrc: string = $state('');
	let customLog: string = $state('');

	onMount(() => {
		if (targetInput) {
			targetInput.focus();
		}
	});
</script>

<svelte:head>
	<title>Add Stream - Multiview</title>
</svelte:head>

<Container>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve('/(view)/(multiview)')}>
			{#snippet header()}
				<h2>Add Stream</h2>
			{/snippet}
			{#if !isStreamCreated}
				<form
					onsubmit={async (event) => {
						event.preventDefault();
						if (!(event.target instanceof HTMLFormElement)) {
							return;
						}
						const form: HTMLFormElement = event.target;
						const formData: FormData = new FormData(form);
						const responseData = Object.fromEntries(formData.entries());

						const response = await sendCommand('addStream', responseData);
						customLog = response.message;

						if (!response.success) {
							return;
						}

						const { eventUrl } = response.data as streamEventResponseSchema;

						isStreamCreated = true;
						if (!eventUrl) {
							customLog = "No event URL? There's something wrong with the server.";
							isStreamCreated = false;
							return;
						}

						eventSrc = `${data.eventRootUrl}${eventUrl}`;
					}}
				>
					<div class="controls">
						<div class="controls-input">
							<span>
								<label for="url">Stream URL</label>
								<input bind:this={targetInput} name="url" placeholder="Stream URL" />
							</span>
							<span>
								<label for="path">Path</label>
								<input name="path" placeholder="Path" />
							</span>
							<Button type="submit">Add</Button>
						</div>
					</div>
				</form>
			{/if}
			<ConsoleLog eventUrl={eventSrc} {customLog} />
		</Prompt>
	</Subcontainer>
</Container>

<style lang="postcss">
	@reference "tailwindcss";
	span {
		@apply flex w-full flex-row items-center space-x-4;
	}

	span > label {
		@apply w-24;
	}
	span > input {
		@apply grow;
	}
	.controls {
		@apply relative flex w-full justify-between space-x-4;
	}

	.controls-input {
		@apply flex w-full flex-col space-y-4 xl:flex-row xl:space-y-0 xl:space-x-4;
	}
</style>
