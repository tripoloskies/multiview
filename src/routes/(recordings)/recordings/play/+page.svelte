<script>

let { data } = $props()

</script>
<svelte:head>
	<title>{data.title} - Multiview Recordings</title>
</svelte:head>
<div class="playback-container">
	<div class="playback-container-header">
		<div>
			<h2>Playback</h2>
		</div>
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
		@apply flex justify-between bg-neutral-800 flex-col md:flex-row space-y-4 md:space-y-0;
	}
	.error {
		@apply flex items-center justify-center pt-4;
	}
	video {
		@apply aspect-video;
	}
</style>
