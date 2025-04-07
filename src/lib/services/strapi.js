// Access Strapi REST API directly using fetch
// Based on Strapi documentation: https://docs.strapi.io/cms/api/rest

// Get Strapi URL from environment variable, fallback to hardcoded URL if not set
export const STRAPI_API_URL = import.meta.env.STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';
const API_PREFIX = '/api';

/**
 * Helper function to make API requests to Strapi
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options
    };

    const url = `${STRAPI_API_URL}${API_PREFIX}${endpoint}`;

    try {
        const response = await fetch(url, mergedOptions);

        // Handle non-OK responses
        if (!response.ok) {
            console.error(`Response not OK: ${response.status} ${response.statusText}`);
            let errorBody;
            try {
                errorBody = await response.json();
                console.error('Error body:', errorBody);
            } catch (jsonError) {
                console.error('Failed to parse error response as JSON');
            }

            const error = new Error(errorBody?.error?.message || 'An API error occurred');
            error.status = response.status;
            throw error;
        }

        // For DELETE requests which don't return content
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`API error for ${url}:`, error);
        throw error;
    }
}

/**
 * Fetch all categories
 */
export const getCategories = async () => {
    try {
        // Use the wildcard populate parameter to get all relations including thumbnails
        // Add a timestamp to prevent caching
        const query = new URLSearchParams({
            'populate': '*',
            '_t': Date.now() // Cache busting parameter
        }).toString();

        const response = await fetchAPI(`/categories?${query}`);

        // Validate the response has the expected format
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Invalid categories response format');
            return [];
        }
        
        // Transform the data to match the expected structure in the UI components
        const transformedData = response.data
            .map((category) => {
                // Check if the data already has the expected "attributes" structure
                if (category.attributes && typeof category.attributes === 'object') {
                    // Make sure we preserve the documentId at the top level
                    if (category.documentId) {
                        return {
                            ...category,
                            documentId: category.documentId
                        };
                    }
                    return category;
                }
                // Otherwise, transform flat data to nested attributes structure
                else if (category.name && category.slug) {
                    const transformed = {
                        id: category.id,
                        documentId: category.documentId,
                        attributes: {
                            name: category.name,
                            slug: category.slug,
                            description: category.description
                        }
                    };
                    
                    // Handle thumbnail specially to ensure proper structure
                    if (category.thumbnail) {
                        if (typeof category.thumbnail === 'object') {
                            // If thumbnail is an object with data property
                            if (category.thumbnail.data) {
                                transformed.attributes.thumbnail = category.thumbnail;
                            }
                            // If thumbnail has url directly
                            else if (category.thumbnail.url) {
                                transformed.attributes.thumbnail = {
                                    data: {
                                        attributes: {
                                            url: category.thumbnail.url
                                        }
                                    }
                                };
                            }
                        } else if (typeof category.thumbnail === 'string') {
                            // If thumbnail is just a string URL
                            transformed.attributes.thumbnail = {
                                data: {
                                    attributes: {
                                        url: category.thumbnail
                                    }
                                }
                            };
                        }
                    }
                    
                    return transformed;
                }
                // Skip invalid entries
                else {
                    console.warn('Invalid category entry:', category);
                    return null;
                }
            })
            .filter(Boolean);
        
        return transformedData;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

/**
 * Fetch a specific category with all its images
 * @param {string} slugOrId - The category slug or ID
 */
export const getCategoryWithImages = async (slugOrId) => {
    try {
        // Check if it looks like a documentId (alphanumeric string)
        const isDocumentId = typeof slugOrId === 'string' && /^[a-z0-9]+$/i.test(slugOrId) && slugOrId.length > 10;

        // Check if it's a numeric ID
        const isNumericId = !isNaN(parseInt(slugOrId, 10));

        let endpoint;
        let queryParams;

        if (isDocumentId) {
            endpoint = '/categories';
            queryParams = new URLSearchParams({
                'filters[documentId][$eq]': slugOrId,
                populate: '*'
            }).toString();
        } else if (isNumericId) {
            endpoint = `/categories/${slugOrId}`;
            queryParams = new URLSearchParams({
                populate: '*'
            }).toString();
        } else {
            // Otherwise, normalize the slug and use slug-based filtering
            const normalizedSlug = slugOrId.trim().toLowerCase();

            endpoint = '/categories';
            queryParams = new URLSearchParams({
                'filters[slug][$eq]': normalizedSlug,
                populate: '*'
            }).toString();
        }

        const response = await fetchAPI(`${endpoint}?${queryParams}`);

        // Process the response based on whether we did ID lookup or filtering
        let category;

        if (isNumericId) {
            // ID lookup directly returns the category in data
            category = response.data;
        } else {
            // Filtering returns an array of matches
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Get the first category that matches the slug
                category = response.data[0];
            } else {
                console.warn(`⚠️ No category found with slug: ${slugOrId}`);
                return null;
            }
        }

        // Step 1: Check if we have a flat structure (based on the logs we're seeing)
        if (category.name && category.slug && !category.attributes) {
            // Deep clone the category to avoid reference issues
            const flatCategory = { ...category };

            // Create a new category with the proper attributes structure
            category = {
                id: flatCategory.id,
                attributes: {
                    name: flatCategory.name,
                    slug: flatCategory.slug,
                    description: flatCategory.description || null
                }
            };

            // Handle images specially since they need the correct nested structure
            if (flatCategory.images) {
                if (Array.isArray(flatCategory.images)) {
                    category.attributes.images = {
                        data: flatCategory.images
                    };
                } else {
                    // If images is not an array, create an empty data array
                    category.attributes.images = { data: [] };
                }
            } else {
                // No images property at all
                category.attributes.images = { data: [] };
            }
        }
        // If category.attributes exists and has expected structure, use that
        else if (category.attributes && typeof category.attributes === 'object') {
            // Already in the right format
        }
        // If category doesn't have attributes but has expected properties directly
        else if (category.name && category.slug) {
            // Convert to expected format with attributes
            category = {
                id: category.id,
                attributes: {
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    // Handle images if they exist
                    images: category.images || { data: [] }
                }
            };
        }
        // Otherwise, create a minimal structure
        else {
            category = {
                id: category.id || 0,
                attributes: {
                    name: slugOrId
                        .split('-')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                        .join(' '),
                    slug: slugOrId,
                    images: { data: [] }
                }
            };
        }

        // Always ensure images property is correctly structured
        if (!category.attributes.images) {
            category.attributes.images = { data: [] };
        } else if (!category.attributes.images.data) {
            // If images exists but doesn't have the proper data array, fix it
            if (Array.isArray(category.attributes.images)) {
                // If images is an array but not wrapped in data property
                category.attributes.images = { data: category.attributes.images };
            } else {
                // Otherwise create an empty data array
                category.attributes.images = { data: [] };
            }
        } else if (!Array.isArray(category.attributes.images.data)) {
            // If data exists but is not an array
            category.attributes.images.data = [];
        }

        return category;
    } catch (error) {
        console.error(`❌ Error fetching category ${slugOrId}:`, error);
        throw error;
    }
};

/**
 * Add a new category
 * @param {Object} categoryData - The category data
 */
export const addCategory = async (categoryData) => {
    try {
        // Check if the thumbnail data is properly formatted in the request
        let thumbnailId = null;
        if (categoryData.data?.thumbnail) {
            // Validate thumbnail structure
            if (categoryData.data.thumbnail.connect && Array.isArray(categoryData.data.thumbnail.connect) && 
                categoryData.data.thumbnail.connect.length > 0 && categoryData.data.thumbnail.connect[0].id) {
                
                thumbnailId = categoryData.data.thumbnail.connect[0].id;
                
                // Ensure the ID is a string, as some Strapi versions expect string IDs
                if (thumbnailId) {
                    categoryData.data.thumbnail.connect[0].id = String(thumbnailId);
                    
                    // Add alternative format for better compatibility
                    categoryData.data.thumbnail.id = thumbnailId;
                }
            }
        }
        
        // First create the category
        try {
            // Use fetch directly to get access to response headers
            const fullUrl = `${STRAPI_API_URL}${API_PREFIX}/categories`;
            
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Category creation failed:', errorText);
                throw new Error(`Category creation failed: ${response.statusText}`);
            }
            
            const responseData = await response.json();
            
            if (!responseData.data) {
                console.error('Invalid response from Strapi');
                throw new Error('Failed to create category: Invalid response');
            }

            // If we have a thumbnail ID, try to fetch the complete category with the thumbnails populated
            if (thumbnailId && responseData.data.id) {
                try {
                    // Wait a moment for Strapi to process the relationship
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Fetch the complete category with all relations including thumbnails
                    const categoryWithThumbnail = await fetchAPI(`/categories/${responseData.data.id}?populate=*`);
                    
                    if (categoryWithThumbnail?.data) {
                        return categoryWithThumbnail.data;
                    }
                } catch (fetchError) {
                    // Continue with the original response if fetching fails
                }
            }

            return responseData.data;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
};

/**
 * Delete a category
 * @param {string|number} id - The category ID
 */
export const deleteCategory = async (id) => {
    try {
        // Ensure the ID is in the right format
        const categoryId = String(id);
        
        // Properly format the request according to Strapi v4 docs
        const deleteResponse = await fetchAPI(`/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Wait a moment for Strapi to process the deletion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
    } catch (error) {
        console.error(`Error deleting category ${id}:`, error);
        throw error;
    }
};

/**
 * Update a category
 * @param {string|number} id - The category ID
 * @param {Object} data - The category data to update
 * @returns {Promise<Object>} The updated category data
 */
export const updateCategory = async (id, data) => {
    try {
        // Make the update request
        const response = await fetchAPI(`/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.data) {
            console.error('Invalid response from Strapi:', response);
            throw new Error('Failed to update category: Invalid response');
        }
        
        // If we have a thumbnail in the update data, try to fetch the complete category with thumbnails populated
        if (data.data?.thumbnail && response.data.id) {
            try {
                // Wait a moment for Strapi to process the relationship
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Fetch the complete category with all relations including thumbnails
                const categoryWithThumbnail = await fetchAPI(`/categories/${response.data.id}?populate=*`);
                
                if (categoryWithThumbnail?.data) {
                    return categoryWithThumbnail.data;
                }
            } catch (fetchError) {
                console.warn('Error fetching updated category with thumbnails:', fetchError);
                // Continue with the original response if fetching fails
            }
        }
        
        return response.data;
    } catch (error) {
        console.error(`Error updating category ${id}:`, error);
        
        // Create a more detailed error object that preserves the original status code
        const enhancedError = new Error(error.message || 'Failed to update category');
        
        // Preserve the status code if it exists
        if (error.status) {
            enhancedError.status = error.status;
        } 
        // Check if the error message contains 404
        else if (error.message && error.message.includes('404')) {
            enhancedError.status = 404;
            enhancedError.message = `Category with ID ${id} no longer exists or was deleted`;
        }
        
        throw enhancedError;
    }
};

/**
 * Add a new image associated with a category
 * @param {Object} imageData - The image data with category ID
 */
export const addImage = async (imageData) => {
    try {
        // Create the request payload using proper Strapi v4 relationship format
        const requestData = {
            data: {
                title: imageData.title,
                description: imageData.description || '',
                image: imageData.image,
                // Handle both the new format (categories.connect) and backward compatibility
                ...(imageData.categories
                    ? { categories: imageData.categories } // Use the categories field directly if provided
                    : imageData.category
                      ? {
                            categories: {
                                connect: [{ id: imageData.category }]
                            }
                        }
                      : {}) // Empty object if neither is provided
            }
        };

        const response = await fetchAPI('/images', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        if (!response.data) {
            console.error('❌ Invalid response from Strapi:', response);
            throw new Error('Failed to create image: Invalid response');
        }

        return response.data;
    } catch (error) {
        console.error('❌ Error adding image:', error);
        throw error;
    }
};

/**
 * Delete an image
 * @param {string|number} id - The image ID or documentId
 */
export const deleteImage = async (id) => {
    try {
        // Handle different ID types
        let documentId;
        const isNumericId = !isNaN(parseInt(id, 10));

        if (isNumericId) {
            // For numeric IDs, try to fetch the image to get its documentId
            try {
                const imageData = await fetchAPI(`/images/${id}?populate=*`);
                if (imageData && imageData.data) {
                    documentId = imageData.data.documentId || imageData.data.attributes?.documentId;
                }

                if (!documentId) {
                    documentId = id;
                }
            } catch (fetchError) {
                documentId = id; // Fall back to the provided ID
            }
        } else {
            // Assume it's already a documentId
            documentId = id;
        }

        // Perform the deletion
        await fetchAPI(`/images/${documentId}`, {
            method: 'DELETE'
        });

        return true;
    } catch (error) {
        console.error(`Error deleting image ${id}:`, error);
        throw error;
    }
};

/**
 * Upload a file to Strapi Media Library
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} The uploaded file data
 */
export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('files', file);

        const url = `${STRAPI_API_URL}${API_PREFIX}/upload`;
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`File upload failed with status ${response.status}`);
            throw new Error(`File upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Strapi returns an array of uploaded files
        if (Array.isArray(data) && data.length > 0) {
            const uploadedFile = data[0];
            return uploadedFile;
        } else {
            console.error('Unexpected upload response format');
            throw new Error('Unexpected response format from upload API');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};
