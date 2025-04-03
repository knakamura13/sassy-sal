/** @type {import('./$types').PageLoad} */
export function load({ params, url, data }) {
    const adminParam = url.searchParams.get('admin');
    const isAdmin = adminParam === 'true';

    // Preserve the category data from the server
    // and merge with any client-side params
    return {
        ...data,
        admin: isAdmin
    };
}
