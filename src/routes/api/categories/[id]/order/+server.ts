import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategoryWithImages } from '$lib/services/sanity/categoryService';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        if (!id) {
            throw error(400, 'Category ID is required');
        }

        // Use the server-side service to get category with images
        const categoryResponse = await getCategoryWithImages(id);

        if (!categoryResponse || !categoryResponse.data) {
            throw error(404, 'Category not found');
        }

        const category = categoryResponse.data;

        // Calculate the highest order value from images
        let highestOrder = 0;
        const images = category.attributes?.images?.data;

        if (images && Array.isArray(images) && images.length > 0) {
            highestOrder = images.reduce((max: number, image: any) => {
                // Check order in various possible locations in the object
                const imageOrder =
                    typeof image.order === 'number'
                        ? image.order
                        : typeof image.attributes?.order === 'number'
                          ? image.attributes.order
                          : 0;

                return imageOrder > max ? imageOrder : max;
            }, 0);
        }

        return json({
            success: true,
            highestOrder,
            suggestedOrder: highestOrder + 2
        });
    } catch (err: any) {
        console.error('[DEBUG] Error fetching category order info:', err);

        if (err.status) {
            throw err;
        }

        throw error(500, 'Failed to fetch category order information');
    }
};
