<script lang="ts">
    import { onMount } from "svelte";
    import ConsoleLog from '$lib/components/ConsoleLog.svelte';
    import SidePlayerContainer from "$lib/components/SidePlayerContainer.svelte";

	let { data } = $props();
	let eventUrl: string = $state("");
	let customLog: string = $state("");

	onMount(() => {
		eventUrl = `${data.eventRootUrl}/events/log?path=${encodeURIComponent(data?.path)}`;
	})


</script>
<svelte:head>
	<title>{data.path ?? "Untitled"} - Inspector</title>
</svelte:head>
<SidePlayerContainer>
	<h2>Inspector</h2>
	<div class="inspector-content">
		<ConsoleLog eventUrl={eventUrl} customLog={customLog}></ConsoleLog>
	</div>
</SidePlayerContainer>
<style lang="postcss">
	@reference "tailwindcss";
	.inspector-content {
		@apply h-full;
	}
</style>
