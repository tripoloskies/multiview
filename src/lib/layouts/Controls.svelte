<script lang="ts">
  let { children, footer } = $props();
</script>

<div class="controls">
  <div class="menu">
    {@render children()}
  </div>
  <div class="stats">
    {@render footer?.()}
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";

  .controls {
    @apply flex w-full flex-col justify-between md:flex-row;
  }
  .menu {
    @apply flex space-x-2;
  }

  :global(.menu > *) {
    @apply grow;
  }

  .stats {
    @apply flex items-center justify-between space-x-4 bg-white px-4;
  }
</style>
