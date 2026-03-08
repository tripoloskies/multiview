<script lang="ts">
  let { full = false, children } = $props();

  let isFull: string = $derived(full ? "full" : "");
</script>

<div class={isFull}>
  {@render children?.()}
</div>

<style lang="postcss">
  @reference "tailwindcss";
  div {
    @apply container mx-auto flex flex-col space-y-2 px-4 pt-8;
  }
</style>
