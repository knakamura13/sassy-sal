/** @type {import('./$types').PageLoad} */
export function load({ params, url, data, prerendering }) {
    // Default to non-admin mode during prerendering
    const isAdmin = prerendering ? false : url.searchParams.get('admin') === 'true';

    // Preserve the category data from the server
    // and merge with any client-side params
    return {
        ...data,
        admin: isAdmin
    };
}
