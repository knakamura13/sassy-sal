import { getCategoryWithImages } from '$lib/services/strapi';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const category = await getCategoryWithImages(params.category);

    if (!category) {
        throw error(404, {
            message: 'Category not found'
        });
    }

    return {
        category
    };
}
