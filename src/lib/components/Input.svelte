<script lang="ts">
  let { name = "", placeholder = "", value = $bindable() } = $props();
</script>

<input type="text" name={name} placeholder={placeholder} bind:value={value} />

<style lang="postcss">
  @reference "tailwindcss";
  input {
    @apply rounded-xl border-2;
  }
</style>
