import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: (Bun.env.HOSTNAME || 'localhost').split(';')
	},
	preview: {
		allowedHosts: (Bun.env.HOSTNAME || 'localhost').split(';')
	}
});
