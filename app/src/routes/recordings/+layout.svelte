<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { sleep } from '@shared/utils/timer';
	import { invalidateAll, onNavigate } from '$app/navigation';

	let { data, children } = $props();

	let isSidebarOpen: boolean = $state(false);

	onNavigate(() => {
		isSidebarOpen = false;
	});

	const INVALIDATE_DATA_DURATION = 2000;

	onMount(async () => {
		while (true) {
			await sleep(INVALIDATE_DATA_DURATION);
			await invalidateAll();
		}
	});
</script>

<svelte:head>
	<title>VOD</title>
</svelte:head>
<div id="vod">
	<nav>
		<div class="nav-items">
			<Button type="button" onclick={() => (isSidebarOpen = !isSidebarOpen)}>
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
						d="M3.75 9h16.5m-16.5 6.75h16.5"
					/>
				</svg>
			</Button>
			<a href={resolve('/recordings')}>
				<h2>VOD</h2>
			</a>
		</div>
		<Button type="link" link={resolve('/(view)/(multiview)')}
			>Back to Multiview</Button
		>
	</nav>
	<main>
		{#if isSidebarOpen}
			<aside>
				<h3>Path Lists</h3>
				<div id="aside-path-lists">
					{#each data.paths as { name, items } (name)}
						<a
							href={resolve('/recordings/path/[...path]/videos/[page]', {
								path: name,
								page: '1'
							})}>{name} {`(${items})`}</a
						>
					{/each}
				</div>
			</aside>
		{/if}
		<div id="page">
			{@render children()}
		</div>
	</main>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	#page {
		@apply grow overflow-x-hidden overflow-y-auto px-4;
	}

	aside {
		@apply absolute h-full w-full min-w-sm space-y-4 overflow-y-auto bg-neutral-700 p-4 lg:relative lg:w-auto;
	}

	#aside-path-lists {
		@apply flex flex-col space-y-2;
	}

	#vod {
		@apply flex h-screen max-h-screen w-full flex-col;
	}

	main {
		@apply flex grow overflow-x-hidden overflow-y-auto bg-black text-white;
	}

	nav {
		@apply flex min-h-12 w-full items-center bg-neutral-900 px-4 text-white;
	}

	.nav-items {
		@apply flex grow items-center space-x-4;
	}
</style>
