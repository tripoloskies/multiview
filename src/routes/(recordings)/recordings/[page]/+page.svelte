<script>
	import Accordion from '$lib/components/Accordion.svelte';
    import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let latestItems = $derived(data.latestRecordingsList);
	let visiblePages = $derived(data.visiblePages);
	let currentPage = $derived(data?.currentPage || 0);
	let totalPage = $derived(data?.pageCount || 0);
	/**
	 * timestampToString
	 * @param {number} unixTimestamp
	 */
	function timestampToString(unixTimestamp) {
		let _date = new Date(unixTimestamp);
		return _date.toDateString();
	}
</script>

<div id="page-header">
	<h1>Latest</h1>
	<div id="page-selectors-container">
		<div>
			Go to Page
		</div>
		<div id="page-selectors">
			{#if currentPage > 3}
			<Button type="link" link="1">1</Button>
			{/if}
			{#each visiblePages as page (page)}
				{#if page == data.currentPage}
				<div id="page-selected">{page}</div>
				{:else}
				<Button type="link" link={String(page)}>{page}</Button>
				{/if}
			{/each}
			{#if currentPage < totalPage - 2}
				<Button type="link" link={String(totalPage)}>{String(totalPage)}</Button>
			{/if}
		</div>
	</div>
</div>

<div class="front">
	{#each latestItems as item (item.name)}
		<Accordion>
			{#snippet header()}
				<h2>{item.name}</h2>
			{/snippet}
			{#each item?.publishedDate as date}
				<a class="path-accordion-option" href={`/recordings/play?path=${encodeURIComponent(item.name)}&date=${encodeURIComponent(date)}`}
					>{timestampToString(date)}</a
				>
			{/each}
		</Accordion>
	{/each}
</div>

<Accordion>
	{#snippet header()}
		<h2>Raw</h2>
	{/snippet}
	<code>
		{JSON.stringify(latestItems)}
	</code>
</Accordion>

<style lang="postcss">
	@reference "tailwindcss";
	.path-accordion-option {
		@apply px-8 py-2;
	}

	#page-header {
		@apply flex justify-between items-center;
	}

	#page-selectors {
		@apply flex;
	}

	#page-selectors-container {
		@apply flex items-center space-x-4;
	}

	#page-selected {
		@apply border-2 border-neutral-500 bg-neutral-500 px-4 py-2 font-bold ;
	}
</style>
