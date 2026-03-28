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
			name: 'internal:recording-server',
			script: './recording/server.ts',
			interpreter: 'bun',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'internal:recording-internal-server',
			script: './recording/internalServer.ts',
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
			name: 'internal:recording-cleaner',
			script: 'bun',
			args: '--bun ./cron/recordingCleaner.ts',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		}
	]
};
