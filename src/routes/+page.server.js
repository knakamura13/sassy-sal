import { getCategories } from '$lib/services/sanity';
import { error } from '@sveltejs/kit';

export async function load({ cookies, prerendering }) {
    // Check for authenticated admin session via cookie
    const isAuthenticated = cookies.get('admin_session') === 'authenticated';
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
