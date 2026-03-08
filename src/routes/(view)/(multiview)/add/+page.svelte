<script lang="ts">
  import { resolve } from "$app/paths";
  import { sendCommand, type wsApiResult } from "$lib/bun/wsApi.svelte";
  import Button from "$lib/components/Button.svelte";
  import ConsoleLog from "$lib/components/ConsoleLog.svelte";
  import Container from "$lib/components/Container.svelte";
  import Prompt from "$lib/components/Prompt.svelte";
  import Subcontainer from "$lib/components/Subcontainer.svelte";
  import { onMount } from "svelte";

  let { data } = $props();
  let isStreamCreated: boolean = $state(false);
  let targetInput: HTMLInputElement | undefined = $state();
  let eventUrl: string = $state("");
  let customLog: string = $state("");

  onMount(() => {
    if (targetInput) {
      targetInput.focus();
    }
  });
</script>

<svelte:head>
  <title>Add Stream - Multiview</title>
</svelte:head>

<Container>
  <Subcontainer front={true}>
    <Prompt returnUrl={resolve("/(view)/(multiview)")}>
      {#snippet header()}
        <h2>Add Stream</h2>
      {/snippet}
      {#if !isStreamCreated}
        <form
          onsubmit={async (event) => {
            event.preventDefault();
            if (!(event.target instanceof HTMLFormElement)) {
              return;
            }
            const form: HTMLFormElement = event.target;
            const formData: FormData = new FormData(form);
            const responseData = Object.fromEntries(formData.entries());

            const response: wsApiResult = await sendCommand(
              "addStream",
              responseData,
            );
            const responseEventUrl = response.data?.eventUrl as string;

            customLog = response.message;

            if (!response.success) {
              return;
            }
            isStreamCreated = true;
            if (!responseEventUrl) {
              customLog =
                "No event URL? There's something wrong with the server.";
              isStreamCreated = false;
              return;
            }

            eventUrl = `${data.eventRootUrl}${responseEventUrl}`;
          }}
        >
          <div class="controls">
            <div class="controls-input">
              <span>
                <label for="url">Stream URL</label>
                <input
                  bind:this={targetInput}
                  name="url"
                  placeholder="Stream URL"
                />
              </span>
              <span>
                <label for="path">Path</label>
                <input name="path" placeholder="Path" />
              </span>
              <Button type="submit">Add</Button>
            </div>
          </div>
        </form>
      {/if}
      <ConsoleLog eventUrl={eventUrl} customLog={customLog} />
    </Prompt>
  </Subcontainer>
</Container>

<style lang="postcss">
  @reference "tailwindcss";
  span {
    @apply flex w-full flex-row items-center space-x-4;
  }

  span > label {
    @apply w-24;
  }
  span > input {
    @apply grow;
  }
  .controls {
    @apply relative flex w-full justify-between space-x-4;
  }

  .controls-input {
    @apply flex w-full flex-col space-y-4 xl:flex-row xl:space-y-0 xl:space-x-4;
  }
</style>
