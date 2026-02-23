<script>
    let { children } = $props() 
</script>
<div>
    {@render children()}
</div>


<style lang="postcss">
    @reference "tailwindcss";
    div {
		@apply  w-full md:w-md flex h-full flex-col bg-neutral-700 text-white p-4 space-y-4;
	}
</style>