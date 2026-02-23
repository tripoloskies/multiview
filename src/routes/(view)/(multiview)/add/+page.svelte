<script>
    import { resolve } from '$app/paths';
    import { sendCommand } from '$lib/bun/wsApi.svelte';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { onDestroy, onMount } from 'svelte';

	let isStreamCreated = $state(false);
	/**
	 * @type {EventSource}
	 */
	let eventSource;
	/**
	 * @type {string[]}
	 */
	let logs = $state([]);

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
			logs = [];
		}
	});
	/**
	 * connectToLogs
	 * @param {string} eventUrl
	 */
	async function connectToLogs(eventUrl) {
		if (eventSource) {
			return;
		}
		// 2. Connect to the SSE endpoint we created earlier
		eventSource = new EventSource(eventUrl);

		eventSource.onmessage = (event) => {
			// This is where you see the "output" of the script starting up
			injectLogs(event.data);
		};

		eventSource.onerror = () => {
			injectLogs(
				"There's something wrong with the server. Don't try again, stop all PM2 tasks first."
			);
			eventSource.close();
		};
	}

	/**
	 * injectLogs
	 * @param {string} log
	 */
	function injectLogs(log) {
		if (logs.length > 60) {
			logs = [];
		}
		logs = [...logs, log];
	}

	onMount(async() => {

		injectLogs('Ready');
	});
</script>

<svelte:head>
	<title>Add Stream - Multiview</title>
</svelte:head>
<Subcontainer>
	<Prompt returnUrl={resolve("/(view)/(multiview)")}>
		{#snippet header()}
			<h2>Add Stream</h2>
		{/snippet}
		{#if !isStreamCreated}
			<form onsubmit={async (event) => {
				event.preventDefault()
				if (!(event.target instanceof HTMLFormElement)) {
					return
				}
				const form = event.target;
				const formData = new FormData(form);
				const data = {...Object.fromEntries(formData.entries())}
				
				const response = await sendCommand("addStream", data)
				const eventUrl = response.data?.eventUrl
				injectLogs(response.message)
				if (!response.success) {
					return;
				}
				isStreamCreated = true;
				if (!eventUrl?.length) {
					injectLogs("No event URL? There's something wrong with the server.");
					isStreamCreated = false;
					return;
				}
				
				connectToLogs(eventUrl);
				
			}}>
				<div class="controls">
					<div class="controls-input">
						<span>
							<label for="url">Stream URL</label>
							<input name="url" placeholder="Stream URL" />
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
		<ConsoleLog {logs} />
	</Prompt>
</Subcontainer>

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
