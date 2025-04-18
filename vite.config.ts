import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit(), purgeCss()],
    build: {
        target: 'esnext'
    },
    resolve: {
        alias: {
            buffer: 'buffer/',
            stream: 'stream-browserify',
            util: 'util/',
            events: 'events/'
        }
    },
    optimizeDeps: {
        include: ['buffer', 'stream-browserify', 'util', 'events'],
        esbuildOptions: {
            define: {
                global: 'globalThis',
                'process.env': '{}',
                'process.browser': 'true',
                'process.version': '"0.0.0"',
                'process.versions': '{}'
            }
        }
    },
    ssr: {
        noExternal: ['buffer', 'stream-browserify', 'util', 'events']
    }
});
