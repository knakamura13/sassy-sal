import { error } from '@sveltejs/kit';

import { getCategoryWithImages, getCategories } from '$lib/services/sanity/categoryService';
import { getImageUrls } from '$lib/services/imageConfig';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, setHeaders, cookies }) => {
    // Check for admin mode from URL search params
    const admin = url.searchParams.get('admin') === 'true';
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

        // Check if category is password protected
        const isPasswordProtected = !!category.attributes.password;

        // If password protected and not admin, always require password prompt
        if (isPasswordProtected && !admin) {
            return {
                category: {
                    id: category.id,
                    attributes: {
                        name: category.attributes.name,
                        order: category.attributes.order,
                        thumbnail: category.attributes.thumbnail,
                        images: { data: [] } // Don't return images for password-protected categories
                    }
                },
                admin,
                requiresPassword: true
            };
        }

        // Ensure images data is properly structured, even if empty
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

                    // Calculate aspect ratio from image dimensions if available
                    if (image.image?.asset?.metadata?.dimensions) {
                        const { width, height } = image.image.asset.metadata.dimensions;
                        if (width && height && height > 0) {
                            image.aspectRatio = width / height;
                        }
                    }
                } catch (error) {
                    console.error('Error generating progressive URLs for image:', error);
                }

                return image;
            });
        }

        return { category, admin, requiresPassword: false };
    } catch (err: any) {
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
};
