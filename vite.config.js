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
    watch: {
      ignored: ["**/.pm2/**"],
    },
  },
});
