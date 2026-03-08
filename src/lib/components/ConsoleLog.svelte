<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  let { eventUrl = "", customLog = "" } = $props();

  const LOG_LENGTH_LIMIT: number = 60;
  const MAX_RETRY_COUNT: number = 10;

  let component: HTMLElement | undefined = $state();
  let oldCustomLog: string = $state("");
  let oldEventUrl: string = $state("");
  let logs: string[] = $state([]);
  let eventSource: EventSource | undefined = $state();
  let retryCount: number = $state(0);

  onMount(() => {
    injectLogs("Ready");
  });

  onDestroy(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  $effect(() => {
    if (oldCustomLog !== customLog) {
      oldCustomLog = customLog;
      injectLogs(oldCustomLog);
    }
  });

  $effect(() => {
    if (oldEventUrl !== eventUrl) {
      oldEventUrl = eventUrl;
      connectToLogs(eventUrl);
    }
  });

  $effect(() => {
    if (component && logs) {
      component.scrollTop = component.scrollHeight;
    }
  });

  async function connectToLogs(eventUrl: string) {
    if (eventSource) {
      eventSource.close();
      injectLogs("Closing Current Stream...");
      await Bun.sleep(500);
      logs = [];
    }

    eventSource = new EventSource(eventUrl);

    injectLogs("Stream instance is now open.");

    eventSource.onmessage = (event) => {
      injectLogs(event.data);
    };

    eventSource.onerror = () => {
      injectLogs(
        "There's something wrong with the server. Don't try again, stop all PM2 tasks first.",
      );
      if (eventSource) {
        if (retryCount > MAX_RETRY_COUNT) {
          eventSource.close();
        }
        injectLogs(
          `There's something wrong in server events. Try again. (${retryCount}/${MAX_RETRY_COUNT})`,
        );
        retryCount++;
        connectToLogs(eventUrl);
      }
    };
  }

  function injectLogs(log: string) {
    if (logs.length > LOG_LENGTH_LIMIT) {
      logs = [];
    }
    logs = [...logs, log];
  }
</script>

<code bind:this={component}>
  {#each logs as log, index (index)}
    {log}
    <br />
  {/each}
</code>

<style lang="postcss">
  @reference "tailwindcss";
  code {
    @apply block h-64 w-full overflow-y-auto border-2 bg-blue-50 p-2 wrap-break-word text-black;
    overflow-anchor: auto;
  }
</style>
