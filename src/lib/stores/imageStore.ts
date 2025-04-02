import { writable } from 'svelte/store';

// Define the Image interface
export interface Image {
  id: string;
  url: string;
  alt: string;
  title?: string;
}

// Initial mock data for the image gallery
const initialImages: Image[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1516567727245-ad8c68f3ec93',
    alt: 'Photography example 1',
    title: 'Urban Architecture'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1511963211013-83bba110595d',
    alt: 'Photography example 2',
    title: 'Nature Scene'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1544511916-0148ccdeb877',
    alt: 'Photography example 3',
    title: 'Portrait Shot'
  }
];

// Create a writable store with initial images
function createImageStore() {
  const { subscribe, set, update } = writable<Image[]>(initialImages);

  return {
    subscribe,
    addImage: (image: Image) => update(images => [...images, image]),
    removeImage: (id: string) => update(images => images.filter(img => img.id !== id)),
    reset: () => set(initialImages),
    set
  };
}

export const imageStore = createImageStore(); 