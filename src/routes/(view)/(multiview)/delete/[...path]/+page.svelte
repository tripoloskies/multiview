<script lang="ts">
  import { sendCommand, type wsApiResult } from "$lib/bun/wsApi.svelte.js";
  import Button from "$lib/components/Button.svelte";
  import ConsoleLog from "$lib/components/ConsoleLog.svelte";
  import Container from "$lib/components/Container.svelte";
  import Prompt from "$lib/components/Prompt.svelte";
  import Subcontainer from "$lib/components/Subcontainer.svelte";
  import { info } from "$lib/stores/info.svelte.js";
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let { data } = $props();
  let customLog: string = $state("");
  let isReady: boolean = $state(false);

  onMount(() => {
    isReady = true;
    if (data.path.length) {
      execute(data.path);
    }
  });

  async function execute(pathName: string) {
    customLog = "Please wait...";
    isReady = false;
    const response: wsApiResult = await sendCommand("deleteStream", {
      path: pathName,
    });
    customLog = response.message;
    if (!response.success) {
      isReady = true;
      return;
    }
    if (data.path.length) {
      await goto(resolve("/(view)/(multiview)"));
      return;
    }
    isReady = true;
  }
</script>

<svelte:head>
  <title>Delete Stream - Multiview</title>
</svelte:head>
<Container full={true}>
  <Subcontainer front={true}>
    <Prompt returnUrl={resolve("/(view)/(multiview)")}>
      {#snippet header()}
        <h2>Delete Stream</h2>
      {/snippet}
      {#if info.instances.length}
        {#if !data.path.length && isReady}
          <form
            onsubmit={async (event) => {
              event.preventDefault();
              if (!(event.target instanceof HTMLFormElement)) {
                return;
              }
              const form = event.target;
              const formData = new FormData(form);
              const data = Object.fromEntries(formData.entries());

              execute(data.path);
            }}
          >
            <div id="inspect-field">
              <label for="path">Path Name</label>
              <select name="path" class="w-full">
                {#each info.instances as list (list.name)}
                  <option value={list?.name}>{list?.labelName}</option>
                {/each}
              </select>
            </div>
            <Button type="submit">Delete</Button>
          </form>
        {/if}
        <hr />
        <ConsoleLog customLog={customLog} />
      {:else}
        <hr />
        <b>There's no instance left</b>
      {/if}
    </Prompt>
  </Subcontainer>
</Container>

<style lang="postcss">
  @reference "tailwindcss";

  form {
    @apply flex justify-between space-x-4;
  }

  #inspect-field {
    @apply flex w-full space-x-4;
  }

  #inspect-field > *:first-child {
    @apply grow;
  }
</style>
