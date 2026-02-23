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
    import { goto } from '$app/navigation';


	let { data } = $props();
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
		if (data.path.length) {
			execute(data.path);
		}
	});


	/**

	 * @param {string} pathName
	 */
	async function execute(pathName) {
		injectLogs("Please wait...")
		const response = await sendCommand("deleteStream", {
			path: pathName
		})
		injectLogs(response.message)
		if (!response.success) {
			return;	
		}

		if (data.path.length) {
			await goto(resolve("/(view)/(multiview)"));
		}
		
	}
</script>

<svelte:head>
	<title>Delete Stream - Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve("/(view)/(multiview)")}>
			{#snippet header()}
				<h2>Delete Stream</h2>
			{/snippet}
			{#if info.instances.length}
				{#if !data.path.length}
				<form onsubmit={async (event) => {
					event.preventDefault()
					if (!(event.target instanceof HTMLFormElement)) {
						return
					}
					const form = event.target;
					const formData = new FormData(form);
					const data = {...Object.fromEntries(formData.entries())}

					execute(data.path)
					
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
				{/if}
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
