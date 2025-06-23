import { client } from './client';
import { transformCategory, transformCategoryWithImages, createSanityImageFromAsset } from './transformers';
import { uploadFile } from './uploadService';
import type { SanityCategory, SanityGalleryImage, FormattedCategory, CategoryData } from './types';

/**
 * Fetch all categories
 * @returns {Promise<FormattedCategory[]>} - Array of categories
 */
export const getCategories = async (): Promise<FormattedCategory[]> => {
    try {
        // Use GROQ to query all categories, sorted by order
        const query = `*[_type == "category"] | order(order asc) {
            _id,
            name,
            order,
            thumbnail,
            password
        }`;

        const categories: SanityCategory[] = await client.fetch(query);

        // Transform the data to match the expected structure in the UI components
        return categories.map(transformCategory);
    } catch (error) {
        console.error('Error fetching categories from Sanity:', error);
        return [];
    }
};

/**
 * Fetch a specific category with all its images
 * @param {string} nameOrId - The category name or ID
 * @returns {Promise<{ data: FormattedCategory } | null>} - Category with images
 */
export const getCategoryWithImages = async (nameOrId: string): Promise<{ data: FormattedCategory } | null> => {
    try {
        // Check if it looks like a document ID
        const isDocumentId = nameOrId.length > 10;

        // Build the GROQ query based on the identifier type
        const query = isDocumentId
            ? `*[_type == "category" && _id == $identifier][0] {
                _id,
                name,
                order,
                thumbnail,
                password,
                "images": *[_type == "galleryImage" && references(^._id)] | order(order asc) {
                    _id,
                    order,
                    image
                }
            }`
            : `*[_type == "category" && name == $identifier][0] {
                _id,
                name,
                order,
                thumbnail,
                password,
                "images": *[_type == "galleryImage" && references(^._id)] | order(order asc) {
                    _id,
                    order,
                    image
                }
            }`;

        const category: SanityCategory & { images: SanityGalleryImage[] } = await client.fetch(query, {
            identifier: nameOrId
        });

        if (!category) {
            return null;
        }

        // Transform the data to match the expected structure in the UI components
        const transformedCategory = transformCategoryWithImages(category);

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error fetching category with images from Sanity:', error);
        return null;
    }
};

/**
 * Add a new category (fast - without thumbnail)
 * @param {Omit<CategoryData, 'thumbnail'>} categoryData - Category data without thumbnail
 * @returns {Promise<{ data: FormattedCategory }>} - The created category
 */
export const addCategoryFast = async (
    categoryData: Omit<CategoryData, 'thumbnail'>
): Promise<{ data: FormattedCategory }> => {
    try {
        // Prepare the category data without the thumbnail for fast creation
        const category: Partial<SanityCategory> = {
            _type: 'category',
            name: categoryData.name,
            order: categoryData.order || 0
        };

        // Add password if provided
        if (categoryData.password && categoryData.password.trim()) {
            category.password = categoryData.password.trim();
        }

        // Call our server endpoint to create the category
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'createCategory',
                data: category
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create category');
        }

        const result = await response.json();
        const createdCategory: SanityCategory = result.data;

        // Transform the response to match expected format
        const transformedCategory = transformCategory(createdCategory);

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error adding category to Sanity:', error);
        throw error;
    }
};

/**
 * Upload thumbnail for an existing category
 * @param {string} categoryId - The category ID
 * @param {File} thumbnailFile - The thumbnail file to upload
 * @returns {Promise<{ data: FormattedCategory }>} - The updated category
 */
export const uploadCategoryThumbnail = async (
    categoryId: string,
    thumbnailFile: File
): Promise<{ data: FormattedCategory }> => {
    try {
        // Upload the thumbnail file first
        const thumbnailAsset = await uploadFile(thumbnailFile);

        // Update the category with the new thumbnail via server endpoint
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'updateCategory',
                data: {
                    id: categoryId,
                    updates: {
                        thumbnail: createSanityImageFromAsset(thumbnailAsset._id)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update category thumbnail');
        }

        const result = await response.json();
        const updatedCategory: SanityCategory = result.data;

        // Transform the response to match expected format
        const transformedCategory = transformCategory(updatedCategory);

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error uploading thumbnail for category:', error);
        throw error;
    }
};

/**
 * Add a new category (legacy - with thumbnail upload)
 * @param {CategoryData} categoryData - Category data to add
 * @returns {Promise<{ data: FormattedCategory }>} - The created category
 */
export const addCategory = async (categoryData: CategoryData): Promise<{ data: FormattedCategory }> => {
    try {
        // For file uploads, we need to use a different approach
        // First, prepare the category data without the thumbnail
        const category: Partial<SanityCategory> = {
            _type: 'category',
            name: categoryData.name,
            order: categoryData.order || 0
        };

        // Add password if provided
        if (categoryData.password && categoryData.password.trim()) {
            category.password = categoryData.password.trim();
        }

        // If there's a thumbnail file, upload it first via separate endpoint
        if (categoryData.thumbnail) {
            const thumbnailAsset = await uploadFile(categoryData.thumbnail);
            category.thumbnail = createSanityImageFromAsset(thumbnailAsset._id);
        }

        // Then call our server endpoint to create the category
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'createCategory',
                data: category
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create category');
        }

        const result = await response.json();
        const createdCategory: SanityCategory = result.data;

        // Transform the response to match expected format
        const transformedCategory = transformCategory(createdCategory);

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error adding category to Sanity:', error);
        throw error;
    }
};

/**
 * Delete a category
 * @param {string} id - The category ID
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<null>} - Null on success
 */
export const deleteCategory = async (
    id: string,
    progressCallback?: (step: number, total: number, message: string) => void
): Promise<null> => {
    try {
        // First find all gallery images that reference this category
        const imagesToDelete: string[] = await client.fetch(
            `*[_type == "galleryImage" && references($categoryId)]._id`,
            {
                categoryId: id
            }
        );

        const totalSteps = imagesToDelete.length + 1; // +1 for the category itself
        let currentStep = 0;

        // Update progress to show we're starting
        if (progressCallback) {
            progressCallback(currentStep, totalSteps, 'Starting category deletion...');
        }

        // Delete each referenced image via server endpoint
        if (imagesToDelete.length > 0) {
            // Delete images one by one
            for (const imageId of imagesToDelete) {
                const response = await fetch('/api/sanity', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        operation: 'deleteImage',
                        data: { imageId }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete image');
                }

                // Increment step and report progress
                currentStep++;
                if (progressCallback) {
                    progressCallback(
                        currentStep,
                        totalSteps,
                        `Deleting image ${currentStep} of ${imagesToDelete.length}...`
                    );
                }
            }

            // Add a small delay to ensure all requests are processed
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Now delete the category itself via server endpoint
        if (progressCallback) {
            progressCallback(totalSteps - 1, totalSteps, 'Deleting category...');
        }

        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'deleteCategory',
                data: { id }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete category');
        }

        // Final progress update
        if (progressCallback) {
            progressCallback(totalSteps, totalSteps, 'Category deleted successfully!');
        }

        return null;
    } catch (error) {
        console.error('Error deleting category from Sanity:', error);
        throw error;
    }
};

/**
 * Update a category
 * @param {string} id - The category ID
 * @param {CategoryData} data - Updated category data
 * @returns {Promise<{ data: FormattedCategory }>} - The updated category
 */
export const updateCategory = async (id: string, data: CategoryData): Promise<{ data: FormattedCategory }> => {
    try {
        // Handle the nested data structure from CategoryCard
        const categoryData = data.data || data;

        const updates: Partial<SanityCategory> = {
            name: categoryData.name,
            order: categoryData.order !== undefined ? categoryData.order : undefined
        };

        // If there's a new thumbnail file, upload it
        if (categoryData.thumbnail && categoryData.thumbnail instanceof File) {
            const thumbnailAsset = await uploadFile(categoryData.thumbnail);
            updates.thumbnail = createSanityImageFromAsset(thumbnailAsset._id);
        }

        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined));

        // Create the patch operation
        let patchOperation = client.patch(id).set(cleanUpdates);

        // Handle password removal separately if needed
        if (categoryData.password !== undefined && !categoryData.password.trim()) {
            patchOperation = patchOperation.unset(['password']);
        } else if (categoryData.password !== undefined && categoryData.password.trim()) {
            patchOperation = patchOperation.set({ password: categoryData.password.trim() });
        }

        // Update the document
        const updatedCategory: SanityCategory = await patchOperation.commit();

        // Transform the response to match expected format
        const transformedCategory = transformCategory(updatedCategory);

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error updating category in Sanity:', error);
        throw error;
    }
};
