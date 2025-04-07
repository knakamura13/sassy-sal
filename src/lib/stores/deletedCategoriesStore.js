import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize store with data from localStorage if available
const storedDeletedCategories = browser ? 
    JSON.parse(localStorage.getItem('deletedCategories') || '[]') : 
    [];

// Create a writable store
const deletedCategoriesStore = writable(storedDeletedCategories);

// Subscribe to changes and update localStorage
if (browser) {
    deletedCategoriesStore.subscribe(value => {
        localStorage.setItem('deletedCategories', JSON.stringify(value));
    });
}

// Helper functions to interact with the store
export const addDeletedCategory = (categoryId) => {
    deletedCategoriesStore.update(ids => {
        if (!ids.includes(categoryId)) {
            return [...ids, categoryId];
        }
        return ids;
    });
};

export const removeDeletedCategory = (categoryId) => {
    deletedCategoriesStore.update(ids => ids.filter(id => id !== categoryId));
};

export const isDeleted = (categoryId) => {
    let result = false;
    deletedCategoriesStore.subscribe(ids => {
        result = ids.includes(categoryId);
    })();
    return result;
};

export const deletedCategories = deletedCategoriesStore;

export default deletedCategoriesStore; 