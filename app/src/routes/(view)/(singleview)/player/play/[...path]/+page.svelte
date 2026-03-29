<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data?.path ?? 'Untitled'} | Multiview</title>
</svelte:head>
