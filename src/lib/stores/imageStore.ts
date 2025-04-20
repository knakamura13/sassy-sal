import { writable } from 'svelte/store';

// Define the responsive URLs interface
export interface ResponsiveUrls {
    small: string;
    medium: string;
    large: string;
}

// Define the Image interface
export interface Image {
    id: string;
    url: string;
    alt: string;
    title?: string;
    categoryId: string; // Associate images with a category
    file?: File; // Optional file property for file uploads
    order?: number; // Order attribute for manual arrangement
    placeholderUrl?: string; // Low quality image placeholder for progressive loading
    thumbnailUrl?: string; // Medium quality/size image for initial display
    fullSizeUrl?: string; // Full-size high quality image for final display
    responsiveUrls?: ResponsiveUrls; // Responsive image URLs for different devices
}

// Create a writable store with initial images
function createImageStore() {
    const { subscribe, set, update } = writable<Image[]>([]);

    return {
        subscribe,
        addImage: (image: Image) => update((images) => [...images, image]),
        removeImage: (id: string) => update((images) => images.filter((img) => img.id !== id)),
        getImagesByCategory: (categoryId: string) => {
            let result: Image[] = [];
            subscribe((images) => {
                result = images.filter((img) => img.categoryId === categoryId);
            })();
            return result;
        },
        reset: () => set([]),
        set
    };
}

export const imageStore = createImageStore();
