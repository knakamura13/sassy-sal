import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a store to track if admin mode is active
function createAdminStore() {
    const { subscribe, set } = writable<boolean>(false);

    // Check for authentication on client-side initialization
    if (browser) {
        // Check for the admin_session cookie using document.cookie
        const hasAdminCookie = document.cookie
            .split('; ')
            .some(cookie => cookie.startsWith('admin_session=authenticated'));

        // Set the initial state based on the cookie
        if (hasAdminCookie) {
            set(true);
        }
    }

    return {
        subscribe,
        login: () => set(true),
        logout: () => set(false),
        set
    };
}

export const adminMode = createAdminStore();
