import imageUrlBuilder from '@sanity/image-url';
import { publicClient as client } from '$lib/sanityClient';

// Set up the image URL builder
const builder = imageUrlBuilder(client);

/**
 * Helper function to generate image URLs from Sanity image references
 * @param {Object} source - Sanity image reference
 * @returns {Object} - Image URL builder object
 */
export function urlFor(source) {
    return builder.image(source);
}
