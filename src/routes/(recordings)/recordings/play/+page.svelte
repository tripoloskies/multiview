<script>
	import { goto } from '$app/navigation';
    import { page } from '$app/state';
	let { data } = $props();

	/** @type {HTMLSelectElement?} */
	let timelineSelector = $state(null);
	let timelines = $derived(data?.availableTimelineThisDate);
	let currentTimeline = $derived(data?.startTime || '');

	async function updateTimeline() {
		const url = new URL(page.url.pathname, page.url.origin)
		url.searchParams.set("path", data?.selectedPath)
		url.searchParams.set("date", String(data?.selectedDate))
		url.searchParams.set("specificDate", timelineSelector?.value || "")

		// We don't use sveltekit's client resolve, just use URL instead.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(url);
	}
</script>
<svelte:head>
	<title>{data.selectedPath} - Multiview Recordings</title>
</svelte:head>
<div class="playback-container">
	<div class="playback-container-header">
		<div>
			<h2>Playback</h2>
		</div>
		{#if data.mediaUrl.length}
		<form>
			<label for="time">Select Timeline</label>
			<select
				bind:this={timelineSelector}
				name="time"
				value={currentTimeline}
				onchange={updateTimeline}
			>
				{#each timelines as timeline (timeline.start)}
					<option value={timeline.start}>{timeline.start}</option>
				{/each}
			</select>
		</form>
		{/if}
	</div>
	<div class="playback-container-body">
		{#if data.mediaUrl.length}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video src={data?.mediaUrl} autoplay controls></video>
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
	select {
		@apply text-black;
	}
	video {
		@apply aspect-video;
	}
</style>
