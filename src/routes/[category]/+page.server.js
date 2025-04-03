import { getCategoryWithImages } from '$lib/services/strapi';
import { error } from '@sveltejs/kit';

export async function load({ params, url }) {
    const admin = url.searchParams.get('admin') === 'true';

    try {
        const category = await getCategoryWithImages(params.category);

        if (!category) {
            throw error(404, 'Category not found');
        }

        return {
            category,
            admin
        };
    } catch (err) {
        console.error(`Error loading category ${params.category}:`, err);

        // If we got a 404 from Strapi, pass it through
        if (err.status === 404) {
            throw error(404, 'Category not found');
        }

        throw error(500, 'Failed to load category');
    }
}
