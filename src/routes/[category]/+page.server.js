import { error } from '@sveltejs/kit';

import { getCategoryWithImages, getCategories } from '$lib/services/sanity';

export async function load({ params, url, prerendering }) {
    // Default to non-admin mode during prerendering
    const admin = prerendering ? false : url.searchParams.get('admin') === 'true';
    const categoryParam = params.category;

    try {
        // First, fetch all categories
        const allCategories = await getCategories();

        // Find the matching category by name (case-insensitive)
        const matchingCategory = allCategories.find(
            (cat) => cat.attributes.name.toLowerCase() === categoryParam.toLowerCase()
        );

        if (!matchingCategory) {
            throw error(404, 'Category not found');
        }

        // Use the category id
        const categoryId = matchingCategory.id;

        // Now fetch the specific category with images using the id
        const categoryResponse = await getCategoryWithImages(categoryId);

        // If no category found with this parameter
        if (!categoryResponse || !categoryResponse.data) {
            throw error(404, 'Category not found');
        }

        const category = categoryResponse.data;

        // Ensure images data is properly structured, even if empty
        if (!category.attributes.images) {
            category.attributes.images = { data: [] };
        }

        return { category, admin };
    } catch (err) {
        // Handle errors
        if (err.status === 404) {
            throw error(404, 'Category not found');
        }

        // For network errors, provide more specific message
        if (
            err.message &&
            (err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('Network request failed'))
        ) {
            throw error(503, 'Cannot connect to content API');
        }

        // Log the error for debugging
        console.error('Error loading category:', err);
        throw error(500, 'Failed to load category');
    }
}
