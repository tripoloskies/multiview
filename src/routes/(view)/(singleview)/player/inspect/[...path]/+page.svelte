<script>
    import { onMount, onDestroy } from "svelte";
    import ConsoleLog from '$lib/components/ConsoleLog.svelte';
    import SidePlayerContainer from "$lib/components/SidePlayerContainer.svelte";

	let { data } = $props()

	/**
	 * @type {string[]}
	 */
	let logs = $state([]);


		/**
	 * @type {EventSource}
	 */
	let eventSource;

	let isReady = false;

	onMount(() => {
		isReady = true;
		connectToLogs(`/logs/${data?.path}`)
	})
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
</script>
<svelte:head>
	<title>{data.path ?? "Untitled"} - Inspector</title>
</svelte:head>
<SidePlayerContainer>
	<h2>Inspector</h2>
	<div class="inspector-content">
		<ConsoleLog logs={logs}></ConsoleLog>
	</div>
</SidePlayerContainer>
<style lang="postcss">
	@reference "tailwindcss";
	.inspector-content {
		@apply h-full;
	}
</style>
