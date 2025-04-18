import { createClient } from '@sanity/client';

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
});

// Helper function to build image URLs
export const urlFor = (source: any) => {
    if (!source) return '';
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${source.asset._ref
        .replace('image-', '')
        .replace('-jpg', '.jpg')
        .replace('-png', '.png')
        .replace('-webp', '.webp')}`;
}; 