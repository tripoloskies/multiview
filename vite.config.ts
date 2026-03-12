import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  preview: {
    host: "127.0.0.1",
    port: Number(Bun.env?.PROD_PORT || 4173),
  },
  server: {
    host: "127.0.0.1",
    port: Number(Bun.env?.DEV_PORT || 5173),
    proxy: {
      "/api/vod": "http://127.0.0.1:3002",
    },
    watch: {
      ignored: ["**/.pm2/**"],
    },
  },
});
