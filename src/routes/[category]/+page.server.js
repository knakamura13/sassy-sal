import { getCategoryWithImages, getCategories } from '$lib/services/strapi';
import { error } from '@sveltejs/kit';

export async function load({ params, url }) {
    const admin = url.searchParams.get('admin') === 'true';
    const categoryParam = params.category;

    try {
        // First, fetch all categories
        const allCategories = await getCategories();

        // Find the matching category by name (case insensitive)
        const matchingCategory = allCategories.find(
            (cat) => cat.attributes.name.toLowerCase() === categoryParam.toLowerCase()
        );

        if (!matchingCategory) {
            throw error(404, 'Category not found');
        }

        // Try to use documentId if available, otherwise fall back to the numeric id
        const categoryId = matchingCategory.documentId || matchingCategory.id;

        // Now fetch the specific category with images using the documentId
        const category = await getCategoryWithImages(categoryId);

        // If no category found with this parameter
        if (!category) {
            throw error(404, 'Category not found');
        }

        // Convert flat structure to attributes format
        if (!category.attributes) {
            category = {
                id: category.id,
                attributes: {
                    name: category.name,
                    slug: category.slug,
                    description: category.description
                }
            };
        }

        // Process images properly
        if (category.images && Array.isArray(category.images)) {
            // Convert flat images array to the nested data structure expected by frontend
            const processedImages = category.images.map((img) => {
                // If image is already in the right format, return it as is
                if (img.attributes && img.attributes.image) {
                    return img;
                }

                // Otherwise, convert from flat to nested structure
                return {
                    id: img.id,
                    attributes: {
                        title: img.title || img.name || 'Image',
                        description: img.description || '',
                        image: {
                            data: {
                                attributes: {
                                    url: img.url || img.image?.url || '',
                                    alternativeText: img.alternativeText || img.alt || ''
                                }
                            }
                        }
                    }
                };
            });

            category.attributes.images = { data: processedImages };
        } else if (category.attributes?.images?.data && Array.isArray(category.attributes.images.data)) {
            // Images data is already in the expected format - do nothing
        } else if (!category.attributes.images) {
            // If no images property at all, create empty structure
            category.attributes.images = { data: [] };
        } else if (Array.isArray(category.attributes.images)) {
            // If images is an array but not in data property
            category.attributes.images = { data: category.attributes.images };
        }

        // Check for required attributes
        if (!category.attributes) {
            category.attributes = {}; // Add an empty attributes object as a fallback
        }

        // Add name if missing (fallback to capitalized slug)
        if (!category.attributes.name) {
            category.attributes.name = categoryParam
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Ensure slug property exists
        if (!category.attributes.slug) {
            category.attributes.slug = categoryParam;
        }

        // Ensure images data is properly structured, even if empty
        if (!category.attributes.images) {
            category.attributes.images = { data: [] };
        } else if (!category.attributes.images.data) {
            // If images exists but doesn't have data property
            if (Array.isArray(category.attributes.images)) {
                category.attributes.images = { data: category.attributes.images };
            } else {
                category.attributes.images = { data: [] };
            }
        } else if (!Array.isArray(category.attributes.images.data)) {
            // If data exists but is not an array
            category.attributes.images.data = [];
        }

        const result = { category, admin };
        return result;
    } catch (err) {
        // Specific Strapi error handling
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

        // Create a fallback category with the ID properly set to handle the case where
        // we received partial data or malformed data from the API
        try {
            // Try to get an ID from the error response if available
            const fallbackId = err.category?.id || -1;

            const fallbackCategory = {
                id: fallbackId,
                attributes: {
                    name: categoryParam
                        .split('-')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' '),
                    slug: categoryParam,
                    description: 'We encountered an issue while loading all details for this category.',
                    images: { data: [] }
                }
            };

            return {
                category: fallbackCategory,
                admin,
                isFallback: true
            };
        } catch (fallbackErr) {
            throw error(500, 'Failed to load category');
        }
    }
}
