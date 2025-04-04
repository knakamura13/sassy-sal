import { writable } from 'svelte/store';

// Define the Image interface
export interface Image {
    id: string;
    url: string;
    alt: string;
    title?: string;
    categoryId: string; // Associate images with a category
    documentId?: string | null; // Strapi documentId for API operations
    strapiId?: number | string; // Original Strapi numeric ID
}

// Initial mock data for the image gallery
const initialImages: Image[] = [
    // Wedding images
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1576694700950-47ff95f5ec81',
        alt: 'Wedding photo 1',
        title: 'Beach Wedding',
        categoryId: '1'
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed',
        alt: 'Wedding photo 2',
        title: 'Wedding Ceremony Decorations',
        categoryId: '1'
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1625037680553-29f6a8873ce0',
        alt: 'Wedding photo 3',
        title: 'Bride Preparation',
        categoryId: '1'
    },

    // Engagement images
    {
        id: '4',
        url: 'https://images.unsplash.com/photo-1664398127880-90b9a61b5020',
        alt: 'Engagement photo 1',
        title: 'Proposal Moment',
        categoryId: '2'
    },
    {
        id: '5',
        url: 'https://images.unsplash.com/photo-1658893575530-ed33910600bc',
        alt: 'Engagement photo 2',
        title: 'Engagement Ring',
        categoryId: '2'
    },

    // Portrait images
    {
        id: '6',
        url: 'https://images.unsplash.com/photo-1577565177023-d0f29c354b69',
        alt: 'Portrait photo 1',
        title: 'Professional Headshot',
        categoryId: '3'
    },
    {
        id: '7',
        url: 'https://images.unsplash.com/photo-1613377517669-fff3dc27ab4a',
        alt: 'Portrait photo 2',
        title: 'Creative Portrait',
        categoryId: '3'
    }
];

// Create a writable store with initial images
function createImageStore() {
    const { subscribe, set, update } = writable<Image[]>(initialImages);

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
        reset: () => set(initialImages),
        set
    };
}

export const imageStore = createImageStore();
