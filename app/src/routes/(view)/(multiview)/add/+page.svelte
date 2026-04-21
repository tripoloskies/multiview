<script lang="ts">
	import { resolve } from '$app/paths';
	import { sendCommand } from '$lib/api/websocket.svelte';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { streamEventResponseSchema } from '@shared/schema/websocket.js';
	import { ellipsisGenerator } from '@shared/utils/browser';
	import { onMount, tick } from 'svelte';

	type streamInputs = {
		url: string;
		path: string;
		lowLatency: boolean;
		log: boolean;
	};

	let { data } = $props();
	let isCreated: boolean = $state(false);
	let targetInput: HTMLInputElement | undefined = $state();
	let eventSrc: string = $state('');
	let customLog: string = $state('');
	let streamInputs: streamInputs[] = $state([]);
	let component: HTMLElement | undefined = $state();

	onMount(() => {
		addAnotherInput();
	});

	$effect(() => {
		if (streamInputs.length && component) {
			component.scrollTop = component.scrollHeight;
		}
		if (targetInput) {
			targetInput.focus();
		}
	});

	function addAnotherInput() {
		streamInputs.push({
			url: '',
			path: '',
			lowLatency: false,
			log: false
		});
	}

	function removeLastInput() {
		if (streamInputs.length > 1) {
			streamInputs.pop();
		}
	}
</script>

<svelte:head>
	<title>Add {streamInputs.length > 1 ? 'Multiple ' : ''}| Multiview</title>
</svelte:head>

<Container>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve('/(view)/(multiview)')}>
			{#snippet header()}
				<h2>Add</h2>
			{/snippet}
			{#if !isCreated}
				<form
					class="control"
					bind:this={component}
					onsubmit={async (event) => {
						let isSuccess: boolean = true;

						event.preventDefault();
						if (!(event.target instanceof HTMLFormElement)) {
							return;
						}

						let filteredStreamInputs =
							streamInputs.length > 1
								? streamInputs.filter(
										({ path, url }) => path.length > 0 || url.length > 0
									)
								: streamInputs;

						if (!filteredStreamInputs.length) {
							customLog =
								'Please complete the field for at least 1 stream input.';
							return;
						}

						let failedStreamInputs: streamInputs[] = [];
						let eventUrlFromLastInput: string = '';

						isCreated = true;
						for (const { path, url, lowLatency, log } of filteredStreamInputs) {
							await tick();
							customLog = `Adding.... (Path: ${path || `blank`} | URL: ${ellipsisGenerator(url, 20) || 'blank'})`;
							const response = await sendCommand('createInstance', {
								url: url,
								path: path,
								lowLatency: lowLatency,
								log: log
							});
							customLog = response.message;

							if (!response.success) {
								failedStreamInputs.push({ path, url, lowLatency, log });
								isSuccess = false;
								continue;
							}

							const { eventUrl } = response.data as streamEventResponseSchema;
							if (!eventUrl) {
								customLog =
									"No event URL? There's something wrong with the server.";
								eventUrlFromLastInput = '';
								failedStreamInputs.push({ path, url, lowLatency, log });
								isSuccess = false;
								continue;
							}

							eventUrlFromLastInput = eventUrl;
						}

						if (streamInputs.length == 1 && isSuccess) {
							eventSrc = `${data.eventRootUrl}${eventUrlFromLastInput}`;
						} else {
							isCreated = false;
							if (isSuccess) {
								streamInputs = [];
								addAnotherInput();
							} else {
								streamInputs = failedStreamInputs;
							}
						}
					}}
				>
					<div class="control-input-container">
						{#each streamInputs as streamInput, index (index)}
							<div class="control-input">
								{#if streamInputs.length > 1}
									<b>Stream {index + 1}</b>
								{/if}
								<div class="control-input-body">
									{#if streamInputs.length - 1 == index}
										<div class="control-input-field">
											<label for={`url${index}`}>Stream URL</label>
											<input
												bind:value={streamInput.url}
												name={`url${index}`}
												bind:this={targetInput}
												placeholder="Stream URL"
											/>
										</div>
									{:else}
										<div class="control-input-field">
											<label for={`url${index}`}>Stream URL</label>
											<input
												bind:value={streamInput.url}
												name={`url${index}`}
												placeholder="Stream URL"
											/>
										</div>
									{/if}

									<div class="control-input-field">
										<label for={`path${index}`}>Path Name</label>
										<input
											bind:value={streamInput.path}
											name={`path${index}`}
											placeholder="Path Name"
										/>
									</div>
									<div class="control-input-advanced-field">
										<div>
											<label for={`lls${index}`}>Low Latency</label>
											<input
												bind:checked={streamInput.lowLatency}
												name={`lls${index}`}
												type="checkbox"
												placeholder="Path Name"
											/>
										</div>
										<div>
											<label for={`log${index}`}>Enable Logging</label>
											<input
												bind:checked={streamInput.log}
												name={`log${index}`}
												type="checkbox"
												placeholder="Enable Logging"
											/>
										</div>
									</div>
								</div>
								{#if streamInputs.length > 1 && index < streamInputs.length - 1}
									<hr />
								{/if}
							</div>
						{/each}
					</div>
					<div class="control-buttons">
						<div class="control-primary-actions">
							<Button type="submit">Add Stream</Button>
						</div>
						<div class="control-secondary-actions">
							<div>
								<p>Input(s): {streamInputs.length}</p>
							</div>
							<div class="stream-inputs-modifier">
								<Button
									type="button"
									onclick={(event) => {
										event.preventDefault();
										addAnotherInput();
									}}
									><svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="size-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
								</Button>
								<Button
									type="button"
									onclick={(event) => {
										event.preventDefault();
										removeLastInput();
									}}
									><svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="size-6"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M5 12h14"
										/>
									</svg>
								</Button>
							</div>
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

	form {
		@apply max-h-96 grow overflow-y-auto;
	}

	.control-input {
		@apply flex flex-col space-y-2;
	}

	.control-input-container {
		@apply space-y-2;
	}

	.control-input-body {
		@apply flex flex-col space-y-2;
	}

	.control-input-field {
		@apply flex items-center;
	}

	.control-input-advanced-field {
		@apply grid grid-cols-2 gap-2;
	}

	.control-input-advanced-field > div {
		@apply flex items-center;
	}

	label {
		@apply block w-24;
	}

	input:not([type='checkbox']),
	.control-input-advanced-field > div > label {
		@apply flex-1;
	}

	.control-buttons {
		@apply sticky bottom-0 flex w-full flex-col-reverse justify-between bg-neutral-100 py-2 md:flex-row;
	}

	.control-primary-actions {
		@apply grid md:flex;
	}

	.control-secondary-actions {
		@apply flex items-center justify-between space-x-2;
	}

	.stream-inputs-modifier {
		@apply flex;
	}
</style>
