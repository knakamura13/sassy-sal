import { writable } from 'svelte/store';

// Define the Category interface
export interface Category {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    description?: string;
}

// Initial mock data for categories
const initialCategories: Category[] = [
    {
        id: '1',
        slug: 'weddings',
        name: 'Weddings',
        imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a',
        description: 'Wedding photography'
    },
    {
        id: '2',
        slug: 'engagements',
        name: 'Engagements',
        imageUrl: 'https://images.unsplash.com/photo-1637870996864-65dc1c00f4dc',
        description: 'Engagement sessions'
    },
    {
        id: '3',
        slug: 'portraiture',
        name: 'Portraiture',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        description: 'Portrait photography'
    }
];

// Create a writable store with initial categories
function createCategoryStore() {
    const { subscribe, set, update } = writable<Category[]>(initialCategories);

    return {
        subscribe,
        addCategory: (category: Category) => update((categories) => [...categories, category]),
        removeCategory: (id: string) => update((categories) => categories.filter((cat) => cat.id !== id)),
        updateCategory: (id: string, data: Partial<Category>) =>
            update((categories) => categories.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))),
        reset: () => set(initialCategories),
        set
    };
}

export const categoryStore = createCategoryStore();
