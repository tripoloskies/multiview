<script lang="ts">
	import ConsoleLog from '$lib/components/ConsoleLog.svelte';
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { info } from '$lib/stores/info.svelte';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';
	import { sendCommand } from '$lib/api/websocket.svelte';
	import { goto } from '$app/navigation';

	let customLog: string = $state('');

	onMount(async () => {
		if (!info.instances) {
			return;
		}
		customLog = `Deleting all instances...`;
		const response = await sendCommand('deleteAllInstance');
		await tick();
		customLog = response.message;

		await goto(resolve('/(view)/(multiview)'));
	});
</script>

<svelte:head>
	<title>Delete All | Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve('/(view)/(multiview)')}>
			{#snippet header()}
				<h2>Delete All</h2>
			{/snippet}
			{#if info.instances.length}
				<hr />
				<ConsoleLog {customLog} />
			{:else}
				<hr />
				<b>There's no instance left</b>
			{/if}
		</Prompt>
	</Subcontainer>
</Container>
