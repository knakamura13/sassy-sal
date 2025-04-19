import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Import environment variables
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';
const token = import.meta.env.VITE_SANITY_API_TOKEN;

// Create Sanity client
export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false, // Set to true for production for better performance
    perspective: 'published', // Only fetch published documents, not drafts
});

// Create image URL builder
const builder = imageUrlBuilder(client);

// Helper function to build image URLs with transformations
export const urlFor = (source: any) => {
    if (!source) return '';
    return builder.image(source);
}; 