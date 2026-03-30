<script lang="ts">
	let {
		onclick = defaultClick,
		type = 'button',
		link = '',
		children,
		preloadDataPolicy = '',
		disabled = false
	} = $props();

	const availablePreloadDataPolicy = ['tap', 'hover'];

	let submitButton: HTMLButtonElement | HTMLInputElement | undefined = $state();

	let otherAttributes: Record<string, unknown> = $derived({
		...(availablePreloadDataPolicy.includes(preloadDataPolicy)
			? { 'data-sveltekit-preload-data': preloadDataPolicy.toLowerCase() }
			: {})
	});

	function defaultClick(event: Event): void {
		event.preventDefault();
		console.log(
			'This is a default click behavior of a button. Maybe you forgot to set up? Right?'
		);
	}

	function submitClick(event: Event): void {
		if (!submitButton) {
			return;
		}
		event.preventDefault();
		submitButton.click();
	}
</script>

{#if type == 'link'}
	<a href={link} {...otherAttributes}>{@render children?.()}</a>
{:else if type == 'submit'}
	<input bind:this={submitButton} type="submit" class="hidden" />
	<button {type} onclick={submitClick} {disabled} {...otherAttributes}
		>{@render children?.()}</button
	>
{:else}
	<button {onclick} {disabled} {...otherAttributes}
		>{@render children?.()}</button
	>
{/if}

<style lang="postcss">
	@reference "tailwindcss";

	button,
	a {
		@apply flex cursor-pointer space-x-2 border-2 border-neutral-800 bg-neutral-800 px-4 py-2 text-center font-bold text-white;
	}
</style>
