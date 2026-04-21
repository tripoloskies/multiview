<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount, tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import PlatformTag from '$lib/components/PlatformTag.svelte';

	let { data, children } = $props();
	let isSidebarOpen: boolean = $state(false);
	let invalidationIntervalId: NodeJS.Timeout | undefined = $state();
	let innerWidth: number = $state(0);
	onMount(() => {
		if (innerWidth >= 1024) {
			isSidebarOpen = true;
		}
		invalidationIntervalId = setInterval(async () => {
			await tick();
			await invalidateAll();
		}, data.invalidateDataDuration);
	});

	function closeSidebar() {
		if (innerWidth >= 1024) {
			return;
		}
		isSidebarOpen = false;
	}

	onDestroy(() => {
		clearInterval(invalidationIntervalId);
	});
</script>

<svelte:window bind:innerWidth />

<svelte:head>
	<title>Recordings</title>
</svelte:head>

<div id="recordings">
	<nav>
		<div class="nav-items">
			<Button type="button" onclick={() => (isSidebarOpen = !isSidebarOpen)}>
				{#if isSidebarOpen}
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
							d="M6 18 18 6M6 6l12 12"
						/>
					</svg>
				{:else}
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
				{/if}
			</Button>
			<a href={resolve('/recordings')} onclick={closeSidebar}>
				<h2>Recordings</h2>
			</a>
		</div>
		<Button type="link" link={resolve('/(view)/(multiview)')}>Multiview</Button>
	</nav>
	<main>
		{#if isSidebarOpen}
			<aside>
				<h3>Path Lists</h3>
				<div id="aside-path-lists">
					{#each data.paths as { name, items } (name)}
						<a
							onclick={closeSidebar}
							href={resolve('/recordings/path/[...path]/videos/[page]', {
								path: name,
								page: '1'
							})}
							><PlatformTag path={name} />
							<span>{`(${items})`}</span>
						</a>
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
		@apply absolute z-50 h-full w-full min-w-sm space-y-4 overflow-y-auto bg-neutral-700 p-4 lg:relative lg:w-auto;
	}

	#aside-path-lists {
		@apply flex flex-col space-y-2;
	}

	#recordings {
		@apply flex h-dvh w-full flex-col;
	}

	main {
		@apply flex grow overflow-x-hidden overflow-y-auto text-white;
	}

	nav {
		@apply flex min-h-12 w-full items-center bg-neutral-900 px-4 text-white;
	}

	.nav-items {
		@apply flex grow items-center space-x-4;
	}
</style>
