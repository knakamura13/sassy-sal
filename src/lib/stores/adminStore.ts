import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a store to track if admin mode is active
function createAdminStore() {
    const { subscribe, set } = writable<boolean>(false);

    // Check for authentication on client-side initialization
    if (browser) {
        // Admin state is determined by the server via cookies
        // The store will be updated by the +page.svelte components
    }

    return {
        subscribe,
        login: () => set(true),
        logout: () => set(false),
        set
    };
}

export const adminMode = createAdminStore();
