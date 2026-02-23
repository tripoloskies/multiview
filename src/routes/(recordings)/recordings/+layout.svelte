<script>

	import Button from '$lib/components/Button.svelte';
	import Container from '$lib/components/Container.svelte';
    import { resolve } from '$app/paths';


	let { children } = $props();
</script>

<svelte:head>
	<title>Multiview Recordings</title>
</svelte:head>
<div class="area">
	<nav>
		<div class="nav-items">
			<a href={resolve("/(recordings)/recordings")}>
				<h2>Multiview Recordings</h2>
			</a>
		</div>
		<Button type="link" link={resolve("/(view)/(multiview)")}>Back to Multiview</Button>
	</nav>
	<Container>
		{@render children()}
	</Container>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.area {
		@apply h-screen w-full overflow-x-hidden overflow-y-auto bg-black text-white;
	}

	nav {
		@apply flex w-full items-center bg-neutral-900 px-4;
	}

	.nav-items {
		@apply flex grow items-center space-x-4;
	}
</style>
