/** @type {import('./$types').PageLoad} */
export function load({ params, url, data, prerendering }) {
    // Default to non-admin mode during prerendering
    const isAdmin = prerendering ? false : url.searchParams.get('admin') === 'true';

    // Preserve the server data (categories) and just update the admin status
    return {
        ...data, // Keep all server-loaded data (including categories)
        admin: isAdmin
    };
}
