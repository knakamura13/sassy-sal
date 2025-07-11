import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategoryWithImages } from '$lib/services/sanity/categoryService';
import { getImageUrls } from '$lib/services/imageConfig';

export const POST: RequestHandler = async ({ params, request }) => {
    try {
        const { categoryName } = params;
        const { password } = await request.json();

        if (!categoryName || !password) {
            throw error(400, 'Category name and password are required');
        }

        console.log('[DEBUG] Fetching password-protected category data for:', categoryName);

        // Fetch the category data including password using server-side client
        const categoryResponse = await getCategoryWithImages(categoryName);

        if (!categoryResponse || !categoryResponse.data) {
            throw error(404, 'Category not found');
        }

        const category = categoryResponse.data;

        // Check if category has password protection
        if (!category.attributes.password) {
            // Category is not password protected, return full data
            console.log('[DEBUG] Category is not password protected, returning full data');
            return json({ success: true, category });
        }

        // Check if provided password matches
        if (category.attributes.password !== password) {
            console.log('[DEBUG] Password mismatch for category:', categoryName);
            return json({ success: false, error: 'Incorrect password' }, { status: 401 });
        }

        console.log('[DEBUG] Password correct, processing category data');

        // Password is correct, process and return full category data
        // Ensure images data is properly structured
        if (!category.attributes.images) {
            category.attributes.images = { data: [] };
        }

        // Pre-process images to add optimized URLs for progressive loading
        if (category.attributes.images.data) {
            category.attributes.images.data = category.attributes.images.data.map((image: any) => {
                // Skip if the image doesn't have a Sanity image reference
                if (!image.image) return image;

                try {
                    // Generate all image URLs using centralized config
                    const urls = getImageUrls(image.image);

                    // Assign URLs to the image object
                    image.placeholderUrl = urls.placeholder;
                    image.url = urls.medium;
                    image.fullSizeUrl = urls.large;

                    // Add responsive URLs for different screen sizes
                    image.responsiveUrls = urls.responsive;
                } catch (error) {
                    console.error('Error generating progressive URLs for image:', error);
                }

                return image;
            });
        }

        console.log('[DEBUG] Successfully processed category data, returning to client');

        return json({ 
            success: true, 
            category: {
                id: category.id,
                attributes: {
                    name: category.attributes.name,
                    description: category.attributes.description,
                    order: category.attributes.order,
                    thumbnail: category.attributes.thumbnail,
                    images: category.attributes.images
                }
            }
        });

    } catch (err: any) {
        console.error('[DEBUG] Error in password-protected category fetch:', err);
        
        if (err.status) {
            throw err;
        }

        throw error(500, 'Failed to fetch category data');
    }
};