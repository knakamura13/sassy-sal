/** @type {import('./$types').PageLoad} */
export function load({ params, url }) {
    const adminParam = url.searchParams.get('admin');
    const isAdmin = adminParam === 'true';

    return {
        admin: isAdmin
    };
}
