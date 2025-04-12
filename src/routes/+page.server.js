import { getCategories } from '$lib/services/sanity';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
    const admin = url.searchParams.get('admin') === 'true';

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
