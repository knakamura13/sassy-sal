import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url, data }) => {
    // Default to non-admin mode during prerendering
    const isAdmin = typeof document === 'undefined' ? false : url.searchParams.get('admin') === 'true';

    // Preserve the category data from the server
    // and merge with any client-side params
    return {
        ...data,
        admin: isAdmin
    };
}; 