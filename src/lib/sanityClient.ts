import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Import environment variables
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';
const useCdn = import.meta.env.VITE_USE_CDN === 'true';

// Create Sanity client (public, read-only)
export const publicClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn, // Use CDN for better performance on public data
    perspective: 'published', // Only fetch published documents, not drafts
    // Add timeout configuration (retries handled by custom logic)
    timeout: 30000, // 30 second timeout
    maxRetries: 0, // Disable automatic retries since we use custom retry logic
    ignoreBrowserTokenWarning: true
});

// Create image URL builder
const builder = imageUrlBuilder(publicClient);

// Helper function to build image URLs with transformations
export const urlFor = (source: any) => {
    if (!source) return '';
    return builder.image(source);
};
