<script lang="ts">
	let { open = false, header, children } = $props();

	let isOpen: boolean = $derived(open);
	function toggle(): void {
		isOpen = !isOpen;
	}
</script>

<div class="accordion">
	<button onclick={toggle} class="path-accordion-header">
		{@render header()}
		<div class="accordion-indicator">
			<b>
				{#if isOpen}
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
							d="m4.5 15.75 7.5-7.5 7.5 7.5"
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
							d="m19.5 8.25-7.5 7.5-7.5-7.5"
						/>
					</svg>
				{/if}
			</b>
		</div>
	</button>
	{#if isOpen}
		<div class="path-accordion-body">
			{@render children()}
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.accordion {
		@apply flex w-full flex-col;
	}

	.path-accordion-body {
		@apply flex flex-col;
	}

	.path-accordion-header {
		@apply flex w-full cursor-pointer items-center justify-between bg-neutral-600 px-2 py-2;
	}
</style>
