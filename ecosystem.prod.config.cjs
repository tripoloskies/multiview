module.exports = {
  apps: [
    {
      name: "internal:svelte",
      script: "bun",
      args: "x --bun vite preview --host",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "internal:mediamtx",
      script: "bash",
      args: "-c ./dist/mediamtx/run.sh",
      watch: false,
    },
    {
      name: "internal:websocket-server",
      script: "./src/websocket/server.ts",
      interpreter: "bun",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "internal:instance-server",
      script: "./src/instance/server.ts",
      interpreter: "bun",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "internal:vod-server",
      script: "./src/vod/server.ts",
      interpreter: "bun",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
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
