import type { Config } from 'prettier';
import sharedConfig from '@shared/config/prettier.ts';

const config: Config = {
	...sharedConfig,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	],
	tailwindStylesheet: './src/routes/layout.css'
};

export default config;
