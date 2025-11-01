import { publicClient } from '$lib/sanityClient';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sanityFetchWithRetry, SanityRetryError, isRetryableError } from '$lib/utils/sanityRetry';

export const load: PageLoad = async () => {
    try {
        // Fetch about me page data from Sanity with retry logic
        const aboutMe = await sanityFetchWithRetry(
            publicClient,
            `*[_type == "aboutMe"][0]`,
            {},
            {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 8000
            }
        );

        // Validate that we got data
        if (!aboutMe) {
            console.error('No aboutMe data found in Sanity');
            throw error(404, 'About Me content not found');
        }

        return {
            aboutMe
        };
    } catch (err) {
        console.error('Failed to load About Me data:', err);

        // Handle SanityRetryError specifically
        if (err instanceof SanityRetryError) {
            console.error(`Sanity request failed after ${err.attempts} attempts:`, err.originalError);

            if (isRetryableError(err.originalError)) {
                throw error(503, 'Unable to load content due to connectivity issues. Please try refreshing the page.');
            } else {
                throw error(500, 'Unable to load content. Please try again later.');
            }
        }

        // Check if it's a network/API error
        if (err instanceof Error && isRetryableError(err)) {
            throw error(503, 'Unable to load content. Please try refreshing the page.');
        }

        // Re-throw SvelteKit errors as-is
        if (err && typeof err === 'object' && 'status' in err) {
            throw err;
        }

        // Generic error fallback
        throw error(500, 'An unexpected error occurred while loading the page.');
    }
};
