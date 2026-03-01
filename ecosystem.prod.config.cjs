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
      script: "./src/server/bun.js",
      interpreter: "bun",
      watch: false,
    },
    {
      name: "internal:renew-cookies",
      script: "bun",
      args: "--bun ./src/cron/renewCookies.js",
      watch: false,
    },
    {
      name: "internal:vod-cleaner",
      script: "bun",
      args: "--bun ./src/cron/vodCleaner.js",
      watch: false,
    },
  ],
};
