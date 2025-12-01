import { error } from '@sveltejs/kit';
import { publicClient } from '$lib/sanityClient';
import { isRetryableError, sanityFetchWithRetry, SanityRetryError } from '$lib/utils/sanityRetry';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, setHeaders }) => {
    const isAdmin = cookies.get('admin_session') === 'authenticated';

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

        if (!aboutMe) {
            console.error('No aboutMe data found in Sanity');
            throw error(404, 'About Me content not found');
        }

        // Cache public responses; keep admin edits fresh
        if (isAdmin) {
            setHeaders({ 'Cache-Control': 'private, no-store' });
        } else {
            setHeaders({ 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' });
        }

        return { aboutMe };
    } catch (err) {
        console.error('Failed to load About Me data:', err);

        if (err instanceof SanityRetryError) {
            console.error(`Sanity request failed after ${err.attempts} attempts:`, err.originalError);

            if (isRetryableError(err.originalError)) {
                throw error(503, 'Unable to load content due to connectivity issues. Please try refreshing the page.');
            } else {
                throw error(500, 'Unable to load content. Please try again later.');
            }
        }

        if (err instanceof Error && isRetryableError(err)) {
            throw error(503, 'Unable to load content. Please try refreshing the page.');
        }

        if (err && typeof err === 'object' && 'status' in err) {
            throw err as any;
        }

        throw error(500, 'An unexpected error occurred while loading the page.');
    }
};
