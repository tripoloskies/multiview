module.exports = {
  apps: [
    {
      name: "internal:svelte",
      script: "bun",
      args: "--bun vite dev --host",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: process.env.PROD_PORT,
      },
    },
    {
      name: "internal:bun-server",
      script: "./src/server/bun.js",
      interpreter: "bun",
      watch: true,
      ignore_watch: [
        "node_modules",
        ".pm2",
        ".svelte-kit",
        "build",
        "db",
        "config",
      ],
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "internal:renew-cookies",
      script: "bun",
      args: "--bun ./src/cron/renewCookies.js",
      watch: false,
    },
  ],
};
