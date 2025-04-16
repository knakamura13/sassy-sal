import { getCategories } from '$lib/services/sanity';
import { error, redirect } from '@sveltejs/kit';

export async function load({ url, cookies, prerendering }) {
    // Check for authenticated admin session via cookie
    const isAuthenticated = cookies.get('admin_session') === 'authenticated';

    // If user tries to access with admin=true but isn't authenticated, redirect to login
    if (url.searchParams.get('admin') === 'true' && !isAuthenticated) {
        throw redirect(303, '/admin');
    }

    const admin = prerendering ? false : isAuthenticated;

    try {
        const categories = await getCategories();

        return {
            categories,
            admin
        };
    } catch (err) {
        console.error('Error loading categories:', err);
        throw error(500, 'Failed to load categories');
    }
}
