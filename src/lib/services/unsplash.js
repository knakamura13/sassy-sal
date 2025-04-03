/**
 * Unsplash API service for fetching random images
 * Using the public API for demo purposes
 * In production, you would need to sign up for an Unsplash API key
 */

// Public Unsplash API for development use only
// In production, use your own API key from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'your-unsplash-access-key';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

/**
 * Fetch a random image from Unsplash by search term
 * @param {string} query - The search term
 * @returns {Promise<string>} - The image URL
 */
export const getRandomImageByQuery = async (query) => {
    try {
        // First try using the Unsplash API if we have a key
        if (UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'your-unsplash-access-key') {
            const response = await fetch(
                `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=squarish`,
                {
                    headers: {
                        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.urls.regular;
            }
        }

        // Fallback directly to Picsum using category name as seed
        return `https://picsum.photos/seed/${encodeURIComponent(query)}/600/600`;
    } catch (error) {
        console.error('Error fetching random image:', error);
        // Return a random Picsum placeholder if all else fails
        return 'https://picsum.photos/600/600';
    }
};
