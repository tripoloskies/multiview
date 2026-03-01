<script>

let { data } = $props()

</script>
<svelte:head>
	<title>{data.title} - Multiview Recordings</title>
</svelte:head>
<div class="playback-container">
	<div class="playback-container-header">
		<h1>{data.title}</h1>
	</div>
	<div class="playback-container-body">
		{#if data.mediaUrl}
		<video src={data.mediaUrl} autoplay muted controls></video>
		{:else}
		<div class="error">
			<h1>Timeline not found.</h1>
		</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.playback-container-header {
		@apply flex justify-between bg-neutral-800 py-2;
	}
	.error {
		@apply flex items-center justify-center pt-4;
	}
	video {
		@apply aspect-video;
	}
</style>
