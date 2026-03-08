<script lang="ts">
  import { selectToAction, viewState } from "$lib/stores/multiview.svelte";
  import { removePersistCommand } from "$lib/bun/wsApi.svelte";
  import Viewer from "$lib/components/Viewer.svelte";
  import Multiview from "$lib/layouts/Multiview.svelte";
  import { config } from "$lib/stores/config.svelte";
  import { info, infoStart } from "$lib/stores/info.svelte.js";
  import { onDestroy, onMount } from "svelte";
  import Button from "$lib/components/Button.svelte";

  let { children } = $props();
  let transactionId: string = $state("");

  onMount(async () => {
    transactionId = infoStart();
  });

  onDestroy(async () => {
    removePersistCommand(transactionId);
  });

  let sources = $derived(
    info.instances.map((instance) => {
      const foundPath = info.paths.find((path) => path.name == instance.name);
      return {
        name: instance.name,
        status: instance.status,
        online: foundPath ? true : false,
      };
    }),
  );
</script>

<Multiview>
  <div id="multiview-container">
    {#each sources as source (source.name)}
      <div class="item">
        {#if viewState.action !== "none"}
          <div class="item-overlay">
            <Button onclick={() => selectToAction(source.name)}
              >{viewState.action.toUpperCase()}?</Button
            >
          </div>
        {/if}
        <Viewer
          path={source?.name}
          muted={true}
          online={source?.online}
          visible={config.showVideoMultiView}
          status={source.status}
        ></Viewer>
      </div>
    {/each}
  </div>
  {#snippet controls()}
    {@render children()}
  {/snippet}
</Multiview>

<style lang="postcss">
  @reference "tailwindcss";
  #multiview-container {
    @apply grid h-full w-full grow grid-cols-2 grid-rows-8 md:grid-cols-4 md:grid-rows-4 xl:grid-cols-4 xl:grid-rows-4;
  }

  .item {
    @apply relative border-2 border-white;
  }

  .item-overlay {
    @apply absolute z-20 flex h-full w-full items-center justify-center;
  }
</style>
