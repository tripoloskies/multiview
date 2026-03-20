<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';

	let redirectUrl: ResolvedPathname | undefined = $state();
	let redirectLabel: string | undefined = $state();

	const { pathname } = new URL(page.url);

	if (pathname.includes('/recordings')) {
		redirectLabel = 'Go back to Recordings';
		redirectUrl = resolve('/recordings');
	} else {
		redirectUrl = resolve('/(view)/(multiview)');
		redirectLabel = 'Go back to Multiview';
	}
</script>

<svelte:head>
	<title>Oops, something went wrong.</title>
</svelte:head>

<main>
	<div id="error-container">
		<h1>Error {page.status}</h1>
		<p>{page.error?.message || 'No Error Message'}</p>
		<Button type="link" link={redirectUrl}>
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
					d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
				/>
			</svg>
			<span>
				{redirectLabel}
			</span>
		</Button>
	</div>
</main>

<style lang="postcss">
	@reference "tailwindcss";
	@import './layout.css';

	main {
		@apply flex h-screen w-full items-center justify-center bg-black text-white;
	}

	h1 {
		@apply bg-neutral-700;
	}
	#error-container {
		@apply space-y-4 bg-neutral-600 p-2 text-center;
	}
</style>
