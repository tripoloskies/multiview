<script>
	let { onclick = defaultClick, type = 'button', link = '', children, disabled = false } = $props();

	/**
	 * @type {HTMLInputElement | undefined}
	 */
	let submitButton = $state();

	function defaultClick() {
		console.log('This is a default click behavior of a button. Maybe you forgot to set up? Right?');
	}

	/**
	 *
	 * @param {Event} e
	 */
	function submitClick(e) {
		if (!submitButton) {
			return;
		}

		e.preventDefault();
		submitButton.click();
	}
</script>

{#if type == 'link'}
	<a href={
	link	// eslint-disable-next-line svelte/no-navigation-without-resolve
	}>{@render children?.()}</a>
{:else if type == 'submit'}
	<input bind:this={submitButton} type="submit" class="hidden" />
	<button {type} onclick={submitClick} {disabled}>{@render children?.()}</button>
{:else}
	<button {onclick} {disabled}>{@render children?.()}</button>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	button,
	a {
		@apply block cursor-pointer border-2 border-neutral-800 bg-neutral-800 px-4 py-2 font-bold text-white text-center;
	}
</style>