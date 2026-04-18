<script lang="ts">
	import PaginationSelector from '$lib/components/PaginationSelector.svelte';
	import VideoCard from '$lib/components/VideoCard.svelte';
	import VideoCardContainer from '$lib/layouts/VideoCardContainer.svelte';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { state, deleteRecording } from '$lib/actions/recordings.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.pathInfo.name} Videos | Recordings</title>
</svelte:head>

<div id="main-menu">
	<div id="page-header">
		<h1>Videos</h1>
	</div>

	{#if data.lists.length}
		<VideoCardContainer>
			{#each data.lists as list (list.id)}
				<VideoCard
					author={list.author}
					link={list.link}
					thumbnail={list.thumbnail}
					title={list.title}
				>
					<span>Actions</span>
					<Button
						onclick={async () => {
							await deleteRecording(list.id);
							invalidateAll();
						}}
						disabled={state.running}
					>
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
								d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
							/>
						</svg>

						<span>Delete</span>
					</Button>
				</VideoCard>
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
