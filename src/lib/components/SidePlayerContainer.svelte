<script lang="ts">
  let { children } = $props();
</script>

<div>
  {@render children()}
</div>

<style lang="postcss">
  @reference "tailwindcss";
  div {
    @apply flex h-full w-full flex-col space-y-4 bg-neutral-700 p-4 text-white md:w-md;
  }
</style>
