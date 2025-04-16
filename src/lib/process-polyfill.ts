/**
 * Polyfill for Node.js process in browser environments
 * This needs to be imported before any code that might use process
 */

interface EventMap {
    [event: string]: Array<(...args: any[]) => void>;
}

class EventEmitter {
    private events: EventMap = {};

    on(event: string, listener: (...args: any[]) => void): this {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }

    emit(event: string, ...args: any[]): boolean {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
    }

    removeListener(event: string, listener: (...args: any[]) => void): this {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
    }
}

// Only apply in browser context
if (typeof window !== 'undefined') {
    // Create a minimal process object if it doesn't exist
    if (!(window as any).process) {
        (window as any).process = {
            env: {},
            browser: true,
            version: '',
            versions: {},
            // Simple nextTick implementation using setTimeout
            nextTick: function (fn: () => void): void {
                setTimeout(fn, 0);
            }
        };
    }

    // Access to process.env is common, ensure it exists
    if (!(window as any).process.env) {
        (window as any).process.env = {};
    }

    // Add minimal EventEmitter implementation if needed by libraries
    if (!(window as any).EventEmitter) {
        (window as any).EventEmitter = EventEmitter;
    }

    // Add events module polyfill
    if (!(window as any).events) {
        (window as any).events = {
            EventEmitter: (window as any).EventEmitter
        };
    }

    // Polyfill URL if needed
    if (!window.URL) {
        window.URL = URL;
    }

    // Add url module polyfill
    if (!(window as any).url) {
        (window as any).url = {
            URL: URL,
            parse: function (urlStr: string): URL {
                return new URL(urlStr);
            }
        };
    }
}

export default {}; 