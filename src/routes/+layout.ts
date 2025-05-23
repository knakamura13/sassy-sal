// Import process polyfill first
import '$lib/process-polyfill';

// Only import other polyfills in browser context
if (typeof window !== 'undefined') {
    // This will only run on the client side
    import('$lib/polyfills');
}

export const ssr = true; // Enable server-side rendering site-wide
export const prerender = false; 