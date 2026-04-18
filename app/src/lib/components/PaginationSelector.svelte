<script lang="ts">
	import Button from './Button.svelte';

	const MAX_VISIBLE_PAGES: number = 5;

	type ScrollabelPageSelectorType = {
		page: number;
		totalPage: number;
	};

	let { page, totalPage }: ScrollabelPageSelectorType = $props();
	let visiblePages: number[] = $state([]);
	let isBackNextButtonAllowed: boolean = $state(false);

	let isFirstPageNumberMustVisible: boolean = $derived(
		!visiblePages.includes(1) && isBackNextButtonAllowed
	);
	let isLastPageNumberMustVisible: boolean = $derived(
		!visiblePages.includes(totalPage) && isBackNextButtonAllowed
	);

	let oldPage: number = $state(0);
	let oldTotalPage: number = $state(0);

	let backButtonLink: string = $derived(page > 1 ? (page - 1).toString() : '1');
	let nextButtonLink: string = $derived(
		page != totalPage ? (page + 1).toString() : totalPage.toString()
	);

	function render() {
		let currentPageIndex: number;
		let totalVisiblePage: number;

		if (page <= 0 || totalPage <= 0) {
			isBackNextButtonAllowed = false;
			return;
		} else {
			isBackNextButtonAllowed = true;
		}

		if (totalPage - 2 > page) {
			currentPageIndex = page >= MAX_VISIBLE_PAGES ? page - 2 : 1;
			totalVisiblePage =
				page >= MAX_VISIBLE_PAGES ? currentPageIndex + 4 : MAX_VISIBLE_PAGES;
		} else {
			currentPageIndex = totalPage - (MAX_VISIBLE_PAGES - 1);
			totalVisiblePage = totalPage;
		}

		visiblePages = [];

		for (
			let currentPage = currentPageIndex;
			currentPage <= totalVisiblePage;
			currentPage++
		) {
			if (currentPage <= 0) {
				continue;
			}
			visiblePages.push(currentPage);
		}
	}

	$effect(() => {
		if (oldPage === page && oldTotalPage === totalPage) {
			return;
		}
		oldPage = page;
		oldTotalPage = totalPage;
		render();
	});

	render();
</script>

<div class="page-selector">
	{#if isBackNextButtonAllowed}
		<Button type="link" preloadDataPolicy="tap" link={backButtonLink}
			>Back</Button
		>
		<div class="page-selector-scollable">
			{#if isFirstPageNumberMustVisible}
				<a href="1" data-sveltekit-preload-data="tap" class="selected">
					<span>1</span>
				</a>
				<div class="inactive">
					<span>...</span>
				</div>
			{/if}
			{#each visiblePages as visiblePage (visiblePage)}
				{#if visiblePage == page}
					<div class="inactive selected">
						<span>{visiblePage.toString()}</span>
					</div>
				{:else}
					<a data-sveltekit-preload-data="tap" href={visiblePage.toString()}>
						<span>{visiblePage.toString()}</span>
					</a>
				{/if}
			{/each}
			{#if isLastPageNumberMustVisible}
				<div class="inactive">
					<span>...</span>
				</div>
				<a
					href={totalPage.toString()}
					data-sveltekit-preload-data="tap"
					class="selected"
				>
					<span>{totalPage.toString()}</span>
				</a>
			{/if}
		</div>
		<Button type="link" preloadDataPolicy="tap" link={nextButtonLink}
			>Next</Button
		>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	a,
	.inactive {
		@apply flex aspect-square min-w-12 items-center justify-center text-center;
	}

	.page-selector {
		@apply flex w-full justify-center space-x-2;
	}

	.page-selector-scollable {
		@apply flex;
	}

	.inactive.selected {
		@apply bg-neutral-500;
	}
</style>
