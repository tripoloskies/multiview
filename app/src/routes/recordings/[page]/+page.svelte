<script lang="ts">
	import PaginationSelector from '$lib/components/PaginationSelector.svelte';
	import VideoCard from '$lib/components/VideoCard.svelte';
	import VideoCardContainer from '$lib/layouts/VideoCardContainer.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Recordings</title>
</svelte:head>

<div id="main-menu">
	<div id="page-header">
		<h1>Latest</h1>
	</div>

	{#if data.lists.length}
		<VideoCardContainer>
			{#each data.lists as list (list.id)}
				<VideoCard
					author={list.author}
					link={list.link}
					thumbnail={list.thumbnail}
					title={list.title}
				/>
			{/each}
		</VideoCardContainer>
	{:else}
		<h2 class="error-message">No Videos</h2>
	{/if}

	<div id="page-footer">
		<PaginationSelector
			page={data.currentPage || 0}
			totalPage={data.totalPage || 0}
		/>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.error-message {
		@apply py-4 text-center;
	}

	#page-header {
		@apply flex items-center justify-between py-4;
	}

	#page-footer {
		@apply sticky bottom-0 w-full bg-black py-2;
	}
</style>
