<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Hls from 'hls.js';
	import { onMount } from 'svelte';
	let { data } = $props();

	let player: HTMLVideoElement | undefined = $state();
	let hls = new Hls();

	onMount(() => {
		if (!player || !Hls.isSupported()) {
			return;
		}
		hls.attachMedia(player);
		hls.on(Hls.Events.MEDIA_ATTACHED, () => {
			hls.loadSource(data.mediaUrl);
		});
	});
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
			<video bind:this={player} autoplay muted controls></video>
			<div class="playback-metadata">
				<div class="playback-metadata-header">
					<div>
						<b>Uploader</b>
						<p>{data.uploader}</p>
					</div>
					{#if data.webpageUrl?.length}
						<Button type="link" link={data.webpageUrl}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
								/>
							</svg>

							<p>Go to Stream URL</p>
						</Button>
					{/if}
				</div>
				<b>Description</b>
				<p>{data.description}</p>
			</div>
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
		@apply flex justify-between bg-neutral-600 px-2 py-2;
	}
	.playback-metadata {
		@apply space-y-4 py-4;
	}
	.playback-metadata-header {
		@apply flex justify-between;
	}
	.error {
		@apply flex items-center justify-center pt-4;
	}
	video {
		@apply aspect-video;
	}
</style>
