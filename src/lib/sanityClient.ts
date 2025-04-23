import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Import environment variables
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';

// Create Sanity client (public, read-only)
export const publicClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Use CDN for better performance on public data
    perspective: 'published', // Only fetch published documents, not drafts
});

// Create image URL builder
const builder = imageUrlBuilder(publicClient);

// Helper function to build image URLs with transformations
export const urlFor = (source: any) => {
    if (!source) return '';
    return builder.image(source);
}; 