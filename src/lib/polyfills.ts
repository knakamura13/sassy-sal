// Polyfills for Node.js built-ins required by Sanity client

// Only run in browser environment
if (typeof window !== 'undefined') {
    // Type definitions for modules
    type BufferModule = {
        Buffer: any;
    };

    type StreamModule = {
        [key: string]: any;
    };

    type UtilModule = {
        [key: string]: any;
    };

    type EventsModule = {
        EventEmitter: any;
        [key: string]: any;
    };

    // Dynamically import to avoid SSR issues
    Promise.all([
        import('buffer').then((m: BufferModule) => {
            (window as any).Buffer = m.Buffer;
        }),
        import('stream-browserify').then((m: StreamModule) => {
            // Ensure stream is available globally
            (window as any).stream = m;
        }),
        import('util').then((m: UtilModule) => {
            (window as any).util = m;
        }),
        import('events').then((m: EventsModule) => {
            // Add EventEmitter to global scope
            (window as any).events = m;
            (window as any).EventEmitter = m.EventEmitter;
        })
    ])
        .then(() => {
            // Set global for libraries that expect it
            (window as any).global = window;

            // Add process polyfill
            if (!(window as any).process) {
                (window as any).process = {
                    env: {},
                    browser: true,
                    version: '',
                    versions: {},
                    nextTick: function (fn: () => void): void {
                        setTimeout(fn, 0);
                    }
                };
            }

            // Create a minimal URL polyfill if needed
            if (typeof URL !== 'undefined' && !(window as any).url) {
                (window as any).url = {
                    URL: URL,
                    parse: function (urlStr: string): URL {
                        return new URL(urlStr);
                    }
                };
            }
        })
        .catch((err: Error) => {
            console.error('Failed to load Node.js polyfills:', err);
        });
}

export { }; 