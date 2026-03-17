import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import sharedConfig from '@shared/config/eslint';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
	...sharedConfig,
	includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns')
]);
