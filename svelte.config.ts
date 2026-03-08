import adapter from "svelte-adapter-bun";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),
    alias: {
      $websocket: "./src/websocket",
      "$websocket/*": "./src/websocket/*",
      $vod: "./src/vod",
      "$vod/*": "./src/vod/*",
      $database: "./src/database",
      "$database/*": "./src/database/*",
      $instance: "./src/instance",
      "$instance/*": "./src/instance/*",
      $external: "./src/external",
      "$external/*": "./src/external/*",
    },
  },
};

export default config;
