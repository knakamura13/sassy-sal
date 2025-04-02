/** @type {import('./$types').PageLoad} */
export function load({ params, url, data }) {
    const adminParam = url.searchParams.get('admin');
    const isAdmin = adminParam === 'true';

    return {
        ...data,
        admin: isAdmin
    };
}
