<script lang="ts">
  let {
    onclick = defaultClick,
    type = "button",
    link = "",
    children,
    disabled = false,
  } = $props();

  let submitButton: HTMLButtonElement | HTMLInputElement | undefined = $state();

  function defaultClick(): void {
    console.log(
      "This is a default click behavior of a button. Maybe you forgot to set up? Right?",
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

{#if type == "link"}
  <a href={link}>{@render children?.()}</a>
{:else if type == "submit"}
  <input bind:this={submitButton} type="submit" class="hidden" />
  <button type={type} onclick={submitClick} disabled={disabled}
    >{@render children?.()}</button
  >
{:else}
  <button onclick={onclick} disabled={disabled}>{@render children?.()}</button>
{/if}

<style lang="postcss">
  @reference "tailwindcss";
  button,
  a {
    @apply block cursor-pointer border-2 border-neutral-800 bg-neutral-800 px-4 py-2 text-center font-bold text-white;
  }
</style>
