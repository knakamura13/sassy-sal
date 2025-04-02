import { writable } from 'svelte/store';

// Create a store to track if admin mode is active
function createAdminStore() {
  const { subscribe, set } = writable<boolean>(false);

  return {
    subscribe,
    login: () => set(true),
    logout: () => set(false),
    set
  };
}

export const adminMode = createAdminStore(); 