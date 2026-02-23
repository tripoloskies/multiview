<script>
    import { resolve } from '$app/paths';
    import { sendCommand } from '$lib/bun/wsApi.svelte.js';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
    import { info } from '$lib/stores/info.svelte.js';
	import { onDestroy, onMount } from 'svelte';
	
	let isReady = $state(false);
	/**
	 * @type {string[]}
	 */
	let logs = $state([]);

	/**
	 * @type {EventSource}
	 */
	let eventSource;

	/**
	 * connectToLogs
	 * @param {string} eventUrl
	 */
	async function connectToLogs(eventUrl) {
		if (!isReady) {
			return;
		}

		isReady = false;
		if (eventSource) {
			eventSource.close();
			injectLogs('Closing Current Stream...');
			await new Promise((resolve) => setTimeout(() => resolve('Pass'), 1000));
			logs = [];
		}
		// 2. Connect to the SSE endpoint we created earlier
		eventSource = new EventSource(eventUrl);

		injectLogs('Stream instance is now open.');
		isReady = true;
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
	$effect(() => {
		info
	});

	onMount(() => {
		isReady = true;
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
			logs = [];
		}
	});

</script>

<svelte:head>
	<title>Inspect Stream - Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer>
		<Prompt returnUrl={resolve("/(view)/(multiview)")}>
			{#snippet header()}
				<h2>Inspector</h2>
			{/snippet}
			{#if info.instances.length}
				<form onsubmit={async (event) => {
					event.preventDefault()
					if (!(event.target instanceof HTMLFormElement)) {
						return
					}
					const form = event.target;
					const formData = new FormData(form);
					const data = {...Object.fromEntries(formData.entries())}
					
					const response = await sendCommand("inspectStream", data)
					const eventUrl = response.data?.eventUrl
					injectLogs(response.message)
					if (!response.success) {
						return;
					}

					if (!eventUrl?.length) {
						injectLogs("No event URL? There's something wrong with the server.");
						return;
					}
					
					connectToLogs(eventUrl);
					
				}}>
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
				<ConsoleLog {logs} />
			{:else}
				<hr/>
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
