import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            fontFamily: {
                garamond: ['Garamond Libre', 'serif'],
                didot: ['Didot', 'serif']
            }
        }
    },
    plugins: []
} satisfies Config;
