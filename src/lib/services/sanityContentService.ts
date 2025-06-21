import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

import { getImageUrls } from './imageConfig';

// Get Sanity configuration from environment variables
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';

// Determine if we're in browser or server environment
const isBrowser = typeof window !== 'undefined';

// Ensure nextTick is available in browser
if (isBrowser && typeof window.process === 'undefined') {
    // Instead of trying to create a full polyfill, just add the one function we need
    // This avoids TypeScript errors with the full Process interface
    window.process = {} as any;
    window.process.nextTick = (fn: () => void) => setTimeout(fn, 0);
}

// Define interfaces for type safety
interface SanityClientConfig {
    projectId: string;
    dataset: string;
    apiVersion: string;
    token: string;
    useCdn: boolean;
    useProjectHostname?: boolean;
    perspective?: 'published' | 'raw' | 'previewDrafts';
    ignoreBrowserTokenWarning?: boolean;
}

interface SanityImage {
    _type: string;
    asset: {
        _ref: string;
        _type: string;
    };
}

interface SanityCategory {
    _id: string;
    _type: string;
    name: string;
    order?: number;
    thumbnail?: SanityImage;
}

interface SanityGalleryImage {
    _id: string;
    _type: string;
    order?: number;
    image: SanityImage;
    category: {
        _type: string;
        _ref: string;
    };
}

interface FormattedCategory {
    id: string;
    documentId: string;
    attributes: {
        name: string;
        order: number;
        thumbnail: {
            data: {
                attributes: {
                    url: string;
                    thumbnailUrl?: string;
                    placeholderUrl?: string;
                    fullSizeUrl?: string;
                    width?: number;
                    height?: number;
                };
            };
        } | null;
        images?: {
            data: FormattedImage[];
        };
    };
}

interface FormattedImage {
    id: string;
    documentId?: string;
    attributes: {
        order: number;
        image: {
            data: {
                attributes: {
                    url: string;
                    thumbnailUrl?: string;
                    placeholderUrl?: string;
                    fullSizeUrl?: string;
                };
            };
        };
    };
}

interface CategoryData {
    name: string;
    order?: number;
    thumbnail?: File;
    data?: {
        name: string;
        order?: number;
        thumbnail?: File;
    };
}

interface ImageData {
    order?: number;
    image: File;
    category: string;
}

/**
 * Initialize the Sanity client with environment-specific options
 */
export const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: false, // Use CDN for better performance on client-side
    // Add browser-specific options only when in browser context
    ...(isBrowser
        ? {
              // Browser-specific options
              useProjectHostname: true, // Use the API hostname for the project instead of api.sanity.io
              perspective: 'published', // Always fetch the published version in browser context
              ignoreBrowserTokenWarning: true // Silence browser warnings about using token in browser
          }
        : {
              // Server-specific options if needed
          })
} as SanityClientConfig);

/**
 * Initialize the image URL builder
 */
const builder = imageUrlBuilder(client);

/**
 * Generate image URLs with Sanity's image pipeline
 * @param {Object} source - The image object from Sanity
 * @returns {Object} - An image URL builder object
 */
export function urlFor(source: any): ImageUrlBuilder {
    if (!source) {
        console.warn('Attempted to generate URL for undefined image source');
        // Create a minimal mock implementation that won't cause TypeScript errors
        return {
            url: () => '',
            width: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            height: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            format: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            auto: () => ({ url: () => '' }) as unknown as ImageUrlBuilder
        } as unknown as ImageUrlBuilder;
    }

    try {
        return builder.image(source);
    } catch (error) {
        console.error('Error generating image URL:', error);
        // Create a minimal mock implementation that won't cause TypeScript errors
        return {
            url: () => '',
            width: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            height: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            format: () => ({ url: () => '' }) as unknown as ImageUrlBuilder,
            auto: () => ({ url: () => '' }) as unknown as ImageUrlBuilder
        } as unknown as ImageUrlBuilder;
    }
}

/**
 * Fetch all categories
 * @returns {Promise<Array>} - Array of categories
 */
export const getCategories = async (): Promise<FormattedCategory[]> => {
    try {
        // Use GROQ to query all categories, sorted by order
        const query = `*[_type == "category"] | order(order asc) {
      _id,
      name,
      order,
      thumbnail
    }`;

        const categories: SanityCategory[] = await client.fetch(query);

        // Transform the data to match the expected structure in the UI components
        return categories.map((category) => {
            // Generate the thumbnail URLs with safer handling
            let thumbnailUrl = '';
            let placeholderUrl = '';
            let fullSizeUrl = '';

            try {
                if (category.thumbnail) {
                    // Use the centralized image configuration
                    const urls = getImageUrls(category.thumbnail);
                    thumbnailUrl = urls.medium;
                    placeholderUrl = urls.placeholder;
                    fullSizeUrl = urls.large;
                }
            } catch (error) {
                console.error('Error generating thumbnail URL for category:', category.name, error);
            }

            return {
                id: category._id,
                documentId: category._id,
                attributes: {
                    name: category.name,
                    order: category.order || 0,
                    thumbnail: category.thumbnail
                        ? {
                              data: {
                                  attributes: {
                                      url: thumbnailUrl,
                                      placeholderUrl: placeholderUrl,
                                      fullSizeUrl: fullSizeUrl
                                  }
                              }
                          }
                        : null
                }
            };
        });
    } catch (error) {
        console.error('Error fetching categories from Sanity:', error);
        return [];
    }
};

/**
 * Fetch a specific category with all its images
 * @param {string} nameOrId - The category name or ID
 * @returns {Promise<Object>} - Category with images
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

        // Generate thumbnail URLs with safe handling
        let thumbnailUrl = '';
        let placeholderUrl = '';
        let fullSizeUrl = '';

        try {
            if (category.thumbnail) {
                // Use the centralized image configuration
                const thumbnailUrls = getImageUrls(category.thumbnail);
                thumbnailUrl = thumbnailUrls.medium;
                placeholderUrl = thumbnailUrls.placeholder;
                fullSizeUrl = thumbnailUrls.large;
            }
        } catch (error) {
            console.error('Error generating category thumbnail URL:', error);
        }

        // Transform the data to match the expected structure in the UI components
        const transformedCategory: FormattedCategory = {
            id: category._id,
            documentId: category._id,
            attributes: {
                name: category.name,
                order: category.order || 0,
                thumbnail: category.thumbnail
                    ? {
                          data: {
                              attributes: {
                                  url: thumbnailUrl,
                                  placeholderUrl: placeholderUrl,
                                  fullSizeUrl: fullSizeUrl
                              }
                          }
                      }
                    : null,
                images: {
                    data: category.images.map((image) => {
                        // Generate progressive image URLs with safe handling
                        let imageUrl = '';
                        let imagePlaceholderUrl = '';
                        let imageFullSizeUrl = '';

                        try {
                            if (image.image) {
                                // Use the centralized image configuration
                                const imageUrls = getImageUrls(image.image);
                                imageUrl = imageUrls.medium;
                                imagePlaceholderUrl = imageUrls.placeholder;
                                imageFullSizeUrl = imageUrls.large;
                            }
                        } catch (error) {
                            console.error('Error generating progressive image URLs:', error);
                        }

                        return {
                            id: image._id,
                            documentId: image._id,
                            attributes: {
                                order: image.order || 0,
                                image: {
                                    data: {
                                        attributes: {
                                            url: imageUrl,
                                            placeholderUrl: imagePlaceholderUrl,
                                            fullSizeUrl: imageFullSizeUrl
                                        }
                                    }
                                }
                            }
                        };
                    })
                }
            }
        };

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error fetching category with images from Sanity:', error);
        return null;
    }
};

/**
 * Add a new category
 * @param {Object} categoryData - Category data to add
 * @returns {Promise<Object>} - The created category
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

        // If there's a thumbnail file, upload it first via separate endpoint
        if (categoryData.thumbnail) {
            const thumbnailAsset = await uploadFile(categoryData.thumbnail);

            category.thumbnail = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: thumbnailAsset._id
                }
            };
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
        const transformedCategory: FormattedCategory = {
            id: createdCategory._id,
            documentId: createdCategory._id,
            attributes: {
                name: createdCategory.name,
                order: createdCategory.order || 0,
                thumbnail: createdCategory.thumbnail
                    ? {
                          data: {
                              attributes: {
                                  url: getImageUrls(createdCategory.thumbnail).medium
                              }
                          }
                      }
                    : null
            }
        };

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
            console.log(`Deleting ${imagesToDelete.length} gallery images for category ${id}`);

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
 * @param {Object} data - Updated category data
 * @returns {Promise<Object>} - The updated category
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
            updates.thumbnail = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: thumbnailAsset._id
                }
            };
        }

        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined));

        // Update the document
        const updatedCategory: SanityCategory = await client.patch(id).set(cleanUpdates).commit();

        // Transform the response to match expected format
        const transformedCategory: FormattedCategory = {
            id: updatedCategory._id,
            documentId: updatedCategory._id,
            attributes: {
                name: updatedCategory.name,
                order: updatedCategory.order || 0,
                thumbnail: updatedCategory.thumbnail
                    ? {
                          data: {
                              attributes: {
                                  url: getImageUrls(updatedCategory.thumbnail).medium
                              }
                          }
                      }
                    : null
            }
        };

        return { data: transformedCategory };
    } catch (error) {
        console.error('Error updating category in Sanity:', error);
        throw error;
    }
};

/**
 * Add a new image to a category
 * @param {Object} imageData - Image data to add
 * @returns {Promise<Object>} - The created image
 */
export const addImage = async (imageData: ImageData): Promise<{ data: FormattedImage }> => {
    try {
        // Handle file upload to Sanity
        const imageAsset = await uploadFile(imageData.image);

        const image: Partial<SanityGalleryImage> = {
            _type: 'galleryImage',
            order: imageData.order || 0,
            image: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                }
            },
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
        const transformedImage: FormattedImage = {
            id: createdImage._id,
            attributes: {
                order: createdImage.order || 0,
                image: {
                    data: {
                        attributes: {
                            url: getImageUrls(createdImage.image).medium
                        }
                    }
                }
            }
        };

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
 * @returns {Promise<Object>} - The updated image
 */
export const updateImage = async (
    id: string,
    data: { order?: number; image?: File }
): Promise<{ data: FormattedImage }> => {
    try {
        const updates: Partial<SanityGalleryImage> = {
            order: data.order !== undefined ? data.order : undefined
        };

        // If there's a new image file, upload it
        if (data.image && data.image instanceof File) {
            const imageAsset = await uploadFile(data.image);
            updates.image = {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAsset._id
                }
            };
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
        const transformedImage: FormattedImage = {
            id: updatedImage._id,
            attributes: {
                order: updatedImage.order || 0,
                image: {
                    data: {
                        attributes: {
                            url: getImageUrls(updatedImage.image).medium
                        }
                    }
                }
            }
        };

        return { data: transformedImage };
    } catch (error) {
        console.error('Error updating image in Sanity:', error);
        throw error;
    }
};

/**
 * Upload a file to Sanity
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - The uploaded asset
 */
export const uploadFile = async (file: File): Promise<any> => {
    try {
        // Check if we're in a browser environment where File is available
        if (!isBrowser) {
            throw new Error('File upload is only available in browser environment');
        }

        // Create form data to send the file
        const formData = new FormData();
        formData.append('file', file);

        // Send to server endpoint for upload
        const response = await fetch('/api/sanity/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
        }

        const result = await response.json();
        return result.asset;
    } catch (error) {
        console.error('Error uploading file to Sanity:', error);
        throw error;
    }
};

// Add support for TypeScript types in browser
declare global {
    interface Window {
        process: any;
    }
}
