import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategories } from '$lib/services/sanity/categoryService';

export const GET: RequestHandler = async ({ cookies }) => {
    try {
        const isAdmin = cookies.get('admin_session') === 'authenticated';

        // Use the server-side service to get categories
        const categories = await getCategories({ bypassCache: isAdmin });

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

        const headers = isAdmin
            ? { 'Cache-Control': 'private, no-store' }
            : { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

        return json(transformedCategories, { headers });
    } catch (err: any) {
        console.error('[DEBUG] Error fetching categories list:', err);

        if (err.status) {
            throw err;
        }

        throw error(500, 'Failed to fetch categories');
    }
};
