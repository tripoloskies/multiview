// eslint.config.js
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import prettier from 'eslint-config-prettier';

export default defineConfig([
	globalIgnores(['tsconfig.json', 'package.json', 'bun.lock']),
	prettier,
	{
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: '',
			globals: { ...globals.bunBuiltin }
		}
	},
	{
		files: ['**/*.{js,mjs,ts,mts,cts}'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: { globals: globals.bunBuiltin }
	},
	tseslint.configs.recommended,
	{
		files: ['**/*.json'],
		plugins: { json },
		language: 'json/json',
		extends: ['json/recommended']
	}
]);
