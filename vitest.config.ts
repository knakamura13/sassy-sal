import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./src/tests/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
        exclude: ['node_modules', 'build', '.svelte-kit']
    },
    resolve: {
        alias: {
            $lib: resolve('src/lib')
        }
    }
});
