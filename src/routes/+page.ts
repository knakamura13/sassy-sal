import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
    // Get admin status from server data
    return {
        ...(data || {}) // Handle case where data could be null
    };
} 