import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit(), purgeCss()],
    build: {
        target: 'esnext'
    },
    // All CSS processing handled by Vite's defaults, which should use the modern API
});
