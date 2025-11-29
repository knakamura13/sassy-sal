import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategories } from '$lib/services/sanity/categoryService';

export const GET: RequestHandler = async () => {
    try {
        // Use the server-side service to get categories
        const categories = await getCategories();

        if (!categories) {
            throw error(404, 'No categories found');
        }

        // Transform to the format expected by Gallery component
        const transformedCategories = categories.map((category: any) => ({
            _id: category.id,
            name: category.attributes.name,
            order: category.attributes.order,
            thumbnail: category.attributes.thumbnail,
            passwordProtected: category.attributes.passwordProtected
        }));

        return json(transformedCategories);
    } catch (err: any) {
        console.error('[DEBUG] Error fetching categories list:', err);

        if (err.status) {
            throw err;
        }

        throw error(500, 'Failed to fetch categories');
    }
};
