import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a store to track if admin mode is active
function createAdminStore() {
    const { subscribe, set } = writable<boolean>(false);

    // Check for authentication on client-side initialization
    if (browser) {
        // Initialize with default value until we check the cookie
        set(false);

        // Move cookie check into a timeout to ensure it runs after hydration
        setTimeout(() => {
            // Check for the admin_session cookie using document.cookie
            const hasAdminCookie = document.cookie
                .split('; ')
                .some((cookie) => cookie.startsWith('admin_session=authenticated'));

            // Set the initial state based on the cookie
            if (hasAdminCookie) {
                set(true);
            }
        }, 0);
    }

    return {
        subscribe,
        login: () => set(true),
        logout: () => set(false),
        set
    };
}

export const adminMode = createAdminStore();
