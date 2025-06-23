import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import type { SanityClientConfig } from './types';

// Get Sanity configuration from environment variables
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';
const useCdn = import.meta.env.VITE_USE_CDN === 'true';

// Determine if we're in browser or server environment
export const isBrowser = typeof window !== 'undefined';

// Ensure nextTick is available in browser for Sanity client compatibility
if (isBrowser && typeof window.process === 'undefined') {
    window.process = {} as any;
    window.process.nextTick = (fn: () => void) => setTimeout(fn, 0);
}

/**
 * Initialize the Sanity client with environment-specific options
 */
export const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn, // Use CDN for better performance on client-side
    // Add browser-specific options only when in browser context
    ...(isBrowser
        ? {
              // Browser-specific options
              useProjectHostname: true, // Use the API hostname for the project instead of api.sanity.io
              perspective: 'published', // Always fetch the published version in browser context
              ignoreBrowserTokenWarning: true // Silence browser warnings about using token in browser
          }
        : {
              // Server-specific options if needed
          })
} as SanityClientConfig);

/**
 * Initialize the image URL builder
 */
const builder = imageUrlBuilder(client);

/**
 * Generate image URLs with Sanity's image pipeline
 * @param {Object} source - The image object from Sanity
 * @returns {Object} - An image URL builder object
 */
export function urlFor(source: any): ImageUrlBuilder {
    if (!source) {
        console.warn('Attempted to generate URL for undefined image source');
        // Create a minimal mock implementation that won't cause TypeScript errors
        return {
            url: () => '',
            width: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            height: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            format: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            auto: () => ({ url: () => '' }) as unknown as ImageUrlBuilder
        } as unknown as ImageUrlBuilder;
    }

    try {
        return builder.image(source);
    } catch (error) {
        console.error('Error generating image URL:', error);
        // Create a minimal mock implementation that won't cause TypeScript errors
        return {
            url: () => '',
            width: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            height: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            format: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            auto: () => ({ url: () => '' }) as unknown as ImageUrlBuilder
        } as unknown as ImageUrlBuilder;
    }
}
