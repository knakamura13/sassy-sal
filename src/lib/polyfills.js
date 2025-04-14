// Polyfills for Node.js built-ins required by Sanity client
// Only run in browser environment
if (typeof window !== 'undefined') {
    // Dynamically import to avoid SSR issues
    Promise.all([
        import('buffer').then((m) => {
            window.Buffer = m.Buffer;
        }),
        import('stream-browserify').then((m) => {
            // Ensure stream is available globally
            window.stream = m;
        }),
        import('util').then((m) => {
            window.util = m;
        }),
        import('events').then((m) => {
            // Add EventEmitter to global scope
            window.events = m;
            window.EventEmitter = m.EventEmitter;
        })
    ])
        .then(() => {
            // Set global for libraries that expect it
            window.global = window;

            // Add process polyfill
            if (!window.process) {
                window.process = {
                    env: {},
                    browser: true,
                    version: '',
                    versions: {},
                    nextTick: function (fn) {
                        setTimeout(fn, 0);
                    }
                };
            }

            // Create a minimal URL polyfill if needed
            if (typeof URL !== 'undefined' && !window.url) {
                window.url = {
                    URL: URL,
                    parse: function (urlStr) {
                        return new URL(urlStr);
                    }
                };
            }
        })
        .catch((err) => {
            console.error('Failed to load Node.js polyfills:', err);
        });
}
