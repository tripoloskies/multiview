import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  preview: {
    port: Number(Bun.env?.PROD_PORT || 4173),
  },
  server: {
    port: Number(Bun.env?.DEV_PORT || 5173),
    proxy: {
      "/api/instance": "http://127.0.0.1:3001",
      "/api/vod": "http://127.0.0.1:3002",
    },
    watch: {
      ignored: ["**/.pm2/**"],
    },
  },
});
