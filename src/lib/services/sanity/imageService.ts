import { transformImage, createSanityImageFromAsset } from './transformers';
import { uploadFile } from './uploadService';
import type { SanityGalleryImage, FormattedImage, ImageData } from './types';

/**
 * Add a new image to a category
 * @param {ImageData} imageData - Image data to add
 * @returns {Promise<{ data: FormattedImage }>} - The created image
 */
export const addImage = async (imageData: ImageData): Promise<{ data: FormattedImage }> => {
    try {
        // Handle file upload to Sanity
        const imageAsset = await uploadFile(imageData.image);

        const image: Partial<SanityGalleryImage> = {
            _type: 'galleryImage',
            order: imageData.order || 0,
            image: createSanityImageFromAsset(imageAsset._id),
            category: {
                _type: 'reference',
                _ref: imageData.category
            }
        };

        // Use server endpoint instead of direct client creation
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'createImage',
                data: image
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create image');
        }

        const result = await response.json();
        const createdImage: SanityGalleryImage = result.data;

        // Transform the response to match expected format
        const transformedImage = transformImage(createdImage);

        return { data: transformedImage };
    } catch (error) {
        console.error('Error adding image to Sanity:', error);
        throw error;
    }
};

/**
 * Delete an image
 * @param {string} id - The image ID
 * @returns {Promise<null>} - Null on success
 */
export const deleteImage = async (id: string): Promise<null> => {
    try {
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'deleteImage',
                data: { imageId: id }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete image');
        }

        return null;
    } catch (error) {
        console.error('Error deleting image from Sanity:', error);
        throw error;
    }
};

/**
 * Update an image
 * @param {string} id - The image ID
 * @param {Object} data - Updated image data
 * @returns {Promise<{ data: FormattedImage }>} - The updated image
 */
export const updateImage = async (
    id: string,
    data: { order?: number; image?: File; spanTwoColumns?: boolean }
): Promise<{ data: FormattedImage }> => {
    try {
        const updates: Partial<SanityGalleryImage> = {
            order: data.order !== undefined ? data.order : undefined,
            spanTwoColumns: data.spanTwoColumns !== undefined ? data.spanTwoColumns : undefined
        };

        // If there's a new image file, upload it
        if (data.image && data.image instanceof File) {
            const imageAsset = await uploadFile(data.image);
            updates.image = createSanityImageFromAsset(imageAsset._id);
        }

        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined));

        // Update the document via server endpoint
        const response = await fetch('/api/sanity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operation: 'updateImage',
                data: {
                    imageId: id,
                    imageUpdates: cleanUpdates
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update image');
        }

        const result = await response.json();
        const updatedImage: SanityGalleryImage = result.data;

        // Transform the response to match expected format
        const transformedImage = transformImage(updatedImage);

        return { data: transformedImage };
    } catch (error) {
        console.error('Error updating image in Sanity:', error);
        throw error;
    }
};
