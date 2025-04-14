/**
 * Polyfill for Node.js process in browser environments
 * This needs to be imported before any code that might use process
 */

// Only apply in browser context
if (typeof window !== 'undefined') {
  // Create a minimal process object if it doesn't exist
  if (!window.process) {
    window.process = {
      env: {},
      browser: true,
      version: '',
      versions: {},
      // Simple nextTick implementation using setTimeout
      nextTick: function(fn) {
        setTimeout(fn, 0);
      }
    };
  }
  
  // Access to process.env is common, ensure it exists
  if (!window.process.env) {
    window.process.env = {};
  }
  
  // Add minimal EventEmitter implementation if needed by libraries
  if (!window.EventEmitter) {
    window.EventEmitter = class EventEmitter {
      constructor() {
        this.events = {};
      }
      
      on(event, listener) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
      }
      
      emit(event, ...args) {
        if (!this.events[event]) return false;
        this.events[event].forEach(listener => listener(...args));
        return true;
      }
      
      removeListener(event, listener) {
        if (!this.events[event]) return this;
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
      }
    };
  }
  
  // Add events module polyfill
  if (!window.events) {
    window.events = {
      EventEmitter: window.EventEmitter
    };
  }
  
  // Polyfill URL if needed
  if (!window.URL) {
    window.URL = URL;
  }
  
  // Add url module polyfill
  if (!window.url) {
    window.url = {
      URL: URL,
      parse: function(urlStr) {
        return new URL(urlStr);
      }
    };
  }
}

export default {}; 