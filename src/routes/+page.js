/** @type {import('./$types').PageLoad} */
export function load({ params, url, data }) {
    const adminParam = url.searchParams.get('admin');
    const isAdmin = adminParam === 'true';

    // Preserve the server data (categories) and just update the admin status
    return {
        ...data, // Keep all server-loaded data (including categories)
        admin: isAdmin
    };
}
