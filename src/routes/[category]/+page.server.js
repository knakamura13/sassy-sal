import { getCategoryWithImages, getCategories } from '$lib/services/strapi';
import { error } from '@sveltejs/kit';

export async function load({ params, url }) {
    const admin = url.searchParams.get('admin') === 'true';
    const categoryParam = params.category;

    console.log(`🌐 Loading category page for parameter: '${categoryParam}'`);
    console.log(`🌐 Parameter type: ${typeof categoryParam}, parameter length: ${categoryParam.length}`);

    // Log all URL parameters for debugging
    console.log(`🌐 Full URL: ${url.toString()}`);
    console.log(`🌐 URL pathname: ${url.pathname}`);
    console.log(`🌐 URL params:`, params);

    try {
        // First, fetch all categories
        console.log(`📤 Fetching all categories to find ID for: '${categoryParam}'`);
        const allCategories = await getCategories();

        // Find the matching category by name (case insensitive)
        const matchingCategory = allCategories.find(
            (cat) => cat.attributes.name.toLowerCase() === categoryParam.toLowerCase()
        );

        if (!matchingCategory) {
            console.log(`🚫 No category found with name: '${categoryParam}'`);
            throw error(404, 'Category not found');
        }

        console.log(
            `✅ Found matching category with ID: ${matchingCategory.id} and documentId: ${matchingCategory.documentId || 'unknown'}`
        );

        // Try to use documentId if available, otherwise fall back to the numeric id
        const categoryId = matchingCategory.documentId || matchingCategory.id;

        // Now fetch the specific category with images using the documentId
        console.log(`📤 Fetching category details using ID: ${categoryId}`);
        const category = await getCategoryWithImages(categoryId);

        // If no category found with this parameter
        if (!category) {
            console.log(`🚫 No category details found for ID: ${categoryId}`);
            throw error(404, 'Category not found');
        }

        console.log(`✅ Category details found: ID=${category.id}`);
        console.log(`📋 Found raw category: ${JSON.stringify(category)}`);

        // Convert flat structure to attributes format
        if (!category.attributes) {
            console.log(`Converting flat structure to attributes format`);
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
        console.log(`Processing images from flat structure`);
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

            console.log(`Converted ${processedImages.length} images to nested structure`);
            category.attributes.images = { data: processedImages };
        } else if (category.attributes?.images?.data && Array.isArray(category.attributes.images.data)) {
            // Images data is already in the expected format - do nothing
            console.log(`Images already in expected format with ${category.attributes.images.data.length} items`);
        } else if (!category.attributes.images) {
            // If no images property at all, create empty structure
            category.attributes.images = { data: [] };
        } else if (Array.isArray(category.attributes.images)) {
            // If images is an array but not in data property
            category.attributes.images = { data: category.attributes.images };
        }

        // Final check of structure
        console.log(
            `Final category structure check: ${JSON.stringify({
                hasId: !!category.id,
                hasAttributes: !!category.attributes,
                hasName: !!category.attributes?.name,
                hasImages: !!category.attributes?.images,
                hasImagesData: !!category.attributes?.images?.data,
                isImagesArray: Array.isArray(category.attributes?.images?.data)
            })}`
        );

        // Check for required attributes
        if (!category.attributes) {
            console.log(`⚠️ Missing attributes property on category`);
            category.attributes = {}; // Add an empty attributes object as a fallback
        }

        // Add name if missing (fallback to capitalized slug)
        if (!category.attributes.name) {
            console.log(`⚠️ Missing name attribute, using fallback`);
            category.attributes.name = categoryParam
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Ensure slug property exists
        if (!category.attributes.slug) {
            console.log(`⚠️ Missing slug attribute, using current slug`);
            category.attributes.slug = categoryParam;
        }

        // Ensure images data is properly structured, even if empty
        if (!category.attributes.images) {
            console.log(`⚠️ Missing images property, creating empty array`);
            category.attributes.images = { data: [] };
        } else if (!category.attributes.images.data) {
            console.log(`⚠️ Images property is malformed, fixing structure`);
            // If images exists but doesn't have data property
            if (Array.isArray(category.attributes.images)) {
                category.attributes.images = { data: category.attributes.images };
            } else {
                category.attributes.images = { data: [] };
            }
        } else if (!Array.isArray(category.attributes.images.data)) {
            // If data exists but is not an array
            console.log(`⚠️ Images data property is not an array, fixing structure`);
            category.attributes.images.data = [];
        }

        // Log the final category data structure for debugging
        console.log(
            `📋 Final category structure:`,
            JSON.stringify({
                id: category.id,
                name: category.attributes.name,
                slug: category.attributes.slug,
                imagesDataType: typeof category.attributes.images.data,
                isImagesArray: Array.isArray(category.attributes.images.data),
                imageCount: Array.isArray(category.attributes.images.data) ? category.attributes.images.data.length : 0
            })
        );

        const result = { category, admin };
        console.log(`🔄 Returning data with category ID ${category.id}`);
        return result;
    } catch (err) {
        console.error(`❌ Error loading category '${categoryParam}':`, err);

        // Specific Strapi error handling
        if (err.status === 404) {
            console.log(`🚫 404 error detected, category not found`);
            throw error(404, 'Category not found');
        }

        // For network errors, provide more specific message
        if (
            err.message &&
            (err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('Network request failed'))
        ) {
            console.error(`🌐 Network error connecting to Strapi API`);
            throw error(503, 'Cannot connect to content API');
        }

        // Create a fallback category with the ID properly set to handle the case where
        // we received partial data or malformed data from the API
        try {
            console.log(`🔄 Attempting to create fallback category for '${categoryParam}'`);

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

            console.log(`✅ Returning fallback category data with ID ${fallbackId}`);
            return {
                category: fallbackCategory,
                admin,
                isFallback: true
            };
        } catch (fallbackErr) {
            console.error(`❌ Failed to create fallback:`, fallbackErr);
            throw error(500, 'Failed to load category');
        }
    }
}
