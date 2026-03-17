module.exports = {
	apps: [
		{
			name: 'internal:websocket-server',
			script: './websocket/server.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:instance-server',
			script: './instance/server.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:instance-internal-server',
			script: './instance/internalServer.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:vod-server',
			script: './vod/server.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:vod-internal-server',
			script: './vod/internalServer.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:renew-cookies',
			script: 'bun',
			args: '--bun ./cron/renewCookies.ts',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:vod-cleaner',
			script: 'bun',
			args: '--bun ./cron/vodCleaner.ts',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		}
	]
};
