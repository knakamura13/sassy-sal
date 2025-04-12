import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env files
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [sveltekit(), purgeCss()],
        build: {
            target: 'esnext'
        },
        resolve: {
            alias: {
                '$sanity': resolve('./sanity')
            }
        },
        // Make environment variables available to the app
        define: {
            'import.meta.env.STRAPI_API_URL': JSON.stringify(env.STRAPI_API_URL)
        }
        // All CSS processing handled by Vite's defaults, which should use the modern API
    };
});
