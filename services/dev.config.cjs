module.exports = {
	apps: [
		{
			name: 'internal:websocket-server',
			script: './websocket/server.ts',
			interpreter: 'bun',
			watch: true,
			ignore_watch: ['node_modules', '.pm2', 'backup', 'config', 'generated', 'prisma'],
			env: {
				NODE_ENV: 'development'
			}
		},
		{
			name: 'internal:instance-server',
			script: './instance/server.ts',
			interpreter: 'bun',
			watch: true,
			ignore_watch: ['node_modules', '.pm2', 'backup', 'config', 'generated', 'prisma'],
			env: {
				NODE_ENV: 'development'
			}
		},
		{
			name: 'internal:instance-internal-server',
			script: './instance/internalServer.ts',
			interpreter: 'bun',
			watch: true,
			ignore_watch: ['node_modules', '.pm2', 'backup', 'config', 'generated', 'prisma'],
			env: {
				NODE_ENV: 'development'
			}
		},
		{
			name: 'internal:vod-server',
			script: './vod/server.ts',
			interpreter: 'bun',
			watch: true,
			ignore_watch: ['node_modules', '.pm2', 'config', 'backup', 'generated', 'prisma'],
			env: {
				NODE_ENV: 'development'
			}
		},
		{
			name: 'internal:vod-internal-server',
			script: './vod/internalServer.ts',
			interpreter: 'bun',
			watch: true,
			ignore_watch: ['node_modules', '.pm2', 'backup', 'config', 'generated', 'prisma'],
			env: {
				NODE_ENV: 'development'
			}
		},
		{
			name: 'internal:renew-cookies',
			script: 'bun',
			args: '--bun ./cron/renewCookies.ts',
			watch: false
		},
		{
			name: 'internal:vod-cleaner',
			script: 'bun',
			args: '--bun ./cron/vodCleaner.ts',
			watch: false
		}
	]
};
