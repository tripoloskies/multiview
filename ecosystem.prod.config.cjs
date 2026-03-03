module.exports = {
  apps: [
    {
      name: "internal:svelte",
      script: "bun",
      args: "--bun vite preview --host",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "internal:bun-server",
      script: "./src/server/bun.ts",
      interpreter: "bun",
      watch: false,
    },
    {
      name: "internal:renew-cookies",
      script: "bun",
      args: "--bun ./src/cron/renewCookies.ts",
      watch: false,
    },
    {
      name: "internal:vod-cleaner",
      script: "bun",
      args: "--bun ./src/cron/vodCleaner.ts",
      watch: false,
    },
  ],
};
