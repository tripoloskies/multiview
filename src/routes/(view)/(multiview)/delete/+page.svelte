<script>
    import { sendCommand } from '$lib/bun/wsApi.svelte.js';
	import Button from '$lib/components/Button.svelte';
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
    import { info } from '$lib/stores/info.svelte.js';
    import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	/**
	 * @type {string[]}
	 */
	let logs = $state([]);

	/**
	 * injectLogs
	 * @param {string} log
	 */
	function injectLogs(log) {
		logs = [...logs, log];
	}

	onMount(() => {
		injectLogs('Ready');
	});
</script>

<svelte:head>
	<title>Delete Stream - Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer>
		<Prompt returnUrl={resolve("/(view)/(multiview)")}>
			{#snippet header()}
				<h2>Delete Stream</h2>
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
					injectLogs("Please wait...")
					const response = await sendCommand("deleteStream", data)
					injectLogs(response.message)
					
				}}>
					<div id="inspect-field">
						<label for="path">Path Name</label>
						<select name="path" class="w-full">
							{#each info.instances as list (list.name)}
								<option value={list?.name}>{list?.labelName}</option>
							{/each}
						</select>
					</div>
					<Button type="submit">Delete</Button>
				</form>
				<hr />
				<ConsoleLog {logs} />
			{:else}
			<hr/>
			<b>There's no instance left</b>
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
