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
    console.log(`[DEBUG] Fetching from URL: ${url}`);

    try {
        const response = await fetch(url, mergedOptions);

        // Handle non-OK responses
        if (!response.ok) {
            console.error(`❌ Response not OK: ${response.status} ${response.statusText}`);
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
        console.error(`❌ API error for ${url}:`, error);
        throw error;
    }
}

/**
 * Fetch all categories
 */
export const getCategories = async () => {
    try {
        console.log(`[DEBUG] Fetching categories from Strapi with thumbnail population`);
        // Use specific media.fields to ensure we get all the thumbnail data including the URL and formats
        const query = new URLSearchParams({
            'populate[thumbnail][populate]': 'true',
            'populate[thumbnail][fields][0]': 'url',
            'populate[thumbnail][fields][1]': 'formats'
        }).toString();

        console.log(`[DEBUG] Query params: ${query}`);
        const response = await fetchAPI(`/categories?${query}`);
        console.log(`[DEBUG] Raw categories response:`, JSON.stringify(response, null, 2));

        // Validate the response has the expected format
        if (!response.data || !Array.isArray(response.data)) {
            console.error('[DEBUG] ❌ Invalid categories response format:', response);
            return [];
        }

        console.log(`[DEBUG] Found ${response.data.length} categories`);

        // Transform the data to match the expected structure in the UI components
        const transformedData = response.data
            .map((category) => {
                console.log(`[DEBUG] Processing category: ${category.id} - ${category.attributes?.name || 'unnamed'}`);
                console.log(`[DEBUG] Raw category data:`, JSON.stringify(category, null, 2));
                
                // Check if the data already has the expected "attributes" structure
                if (category.attributes && typeof category.attributes === 'object') {
                    console.log(`[DEBUG] Category has attributes structure`);
                    
                    // Process thumbnail if it exists to ensure proper structure
                    if (category.attributes.thumbnail) {
                        console.log(`[DEBUG] Category has thumbnail data:`, JSON.stringify(category.attributes.thumbnail, null, 2));
                        
                        // Thumbnail data already exists in proper format, ensure URL is properly formatted
                        const thumbnail = category.attributes.thumbnail;
                        
                        // Log the thumbnail data for debugging
                        console.log(`[DEBUG] 📸 Thumbnail data for category ${category.attributes.name}:`, JSON.stringify(thumbnail, null, 2));
                        
                        // Make sure thumbnail.data.attributes.url exists
                        if (thumbnail.data === null) {
                            console.warn(`[DEBUG] ⚠️ Thumbnail data is null for category ${category.attributes.name}`);
                        } else if (thumbnail.data && thumbnail.data.attributes && thumbnail.data.attributes.url) {
                            console.log(`[DEBUG] ✅ Thumbnail URL found: ${thumbnail.data.attributes.url}`);
                        } else if (thumbnail.data && typeof thumbnail.data === 'object') {
                            // Try to fix malformed thumbnail data
                            console.warn(`[DEBUG] ⚠️ Fixing malformed thumbnail data for category ${category.attributes.name}`);
                            
                            // If we have a URL directly on data object
                            if (thumbnail.data.url) {
                                console.log(`[DEBUG] Found URL directly on data object: ${thumbnail.data.url}`);
                                category.attributes.thumbnail.data.attributes = {
                                    url: thumbnail.data.url
                                };
                            } else {
                                console.log(`[DEBUG] Thumbnail data object structure:`, JSON.stringify(thumbnail.data, null, 2));
                            }
                        }
                    } else {
                        console.log(`[DEBUG] Category has no thumbnail data`);
                    }
                    
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
                    console.log(`[DEBUG] Category has flat structure, transforming`);
                    if (category.thumbnail) {
                        console.log(`[DEBUG] Flat category has thumbnail:`, JSON.stringify(category.thumbnail, null, 2));
                    }
                    
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
                                console.log(`[DEBUG] Using thumbnail.data as is`);
                                transformed.attributes.thumbnail = category.thumbnail;
                            }
                            // If thumbnail has url directly
                            else if (category.thumbnail.url) {
                                console.log(`[DEBUG] Creating thumbnail structure from URL: ${category.thumbnail.url}`);
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
                            console.log(`[DEBUG] Creating thumbnail structure from string URL: ${category.thumbnail}`);
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
                    console.warn(`[DEBUG] ⚠️ Skipping category with ID ${category.id} due to invalid data`);
                    return null;
                }
            })
            .filter(Boolean);

        console.log(`[DEBUG] Transformed ${transformedData.length} categories`);
        console.log(`[DEBUG] First category transformed data:`, transformedData.length > 0 ? JSON.stringify(transformedData[0], null, 2) : 'No categories');
        
        return transformedData;
    } catch (error) {
        console.error('[DEBUG] ❌ Error fetching categories:', error);
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
        console.log(`[DEBUG] Adding new category to Strapi`);
        console.log(`[DEBUG] Raw category data received:`, JSON.stringify(categoryData, null, 2));
        
        // Check if the thumbnail data is properly formatted in the request
        if (categoryData.data?.thumbnail) {
            console.log(`[DEBUG] Thumbnail data found in the request:`, JSON.stringify(categoryData.data.thumbnail, null, 2));
            
            // Validate thumbnail structure
            if (categoryData.data.thumbnail.connect && Array.isArray(categoryData.data.thumbnail.connect)) {
                console.log(`[DEBUG] Thumbnail using connect format with ID:`, categoryData.data.thumbnail.connect[0]?.id);
            } else {
                console.warn(`[DEBUG] ⚠️ Thumbnail data does not use the expected connect format!`);
            }
        } else {
            console.log(`[DEBUG] No thumbnail data in the category request`);
        }
        
        console.log(`[DEBUG] Full request payload:`, JSON.stringify(categoryData, null, 2));
        
        const response = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
        
        console.log(`[DEBUG] Category creation - Raw API response:`, JSON.stringify(response, null, 2));

        if (!response.data) {
            console.error('[DEBUG] ❌ Invalid response from Strapi:', response);
            throw new Error('Failed to create category: Invalid response');
        }

        // Check if the thumbnail is properly included in the response
        if (categoryData.data.thumbnail && response.data.attributes) {
            console.log(`[DEBUG] Checking if thumbnail was saved with category`);
            
            if (response.data.attributes.thumbnail) {
                console.log(`[DEBUG] ✅ Category created with thumbnail in the response`);
                console.log(`[DEBUG] Response thumbnail data structure:`, JSON.stringify(response.data.attributes.thumbnail, null, 2));
                
                // Validate thumbnail data in response is complete
                if (response.data.attributes.thumbnail.data) {
                    console.log(`[DEBUG] Thumbnail data object exists in response`);
                    
                    if (response.data.attributes.thumbnail.data === null) {
                        console.error(`[DEBUG] ❌ Thumbnail data is NULL even though we sent an ID!`);
                    } else if (response.data.attributes.thumbnail.data.id) {
                        console.log(`[DEBUG] ✅ Thumbnail data has ID: ${response.data.attributes.thumbnail.data.id}`);
                    }
                    
                    // Check if URL is available in the response
                    if (response.data.attributes.thumbnail.data?.attributes?.url) {
                        console.log(`[DEBUG] ✅ Thumbnail URL found:`, response.data.attributes.thumbnail.data.attributes.url);
                    } else {
                        console.warn(`[DEBUG] ⚠️ No thumbnail URL in the response`);
                    }
                } else {
                    console.warn(`[DEBUG] ⚠️ Thumbnail exists but data object is missing`);
                }
            } else {
                console.error(`[DEBUG] ❌ Category created but thumbnail is missing in the response despite being in the request!`);
            }
        }

        return response.data;
    } catch (error) {
        console.error('[DEBUG] Error adding category:', error);
        throw error;
    }
};

/**
 * Delete a category
 * @param {string|number} id - The category documentId
 */
export const deleteCategory = async (id) => {
    try {
        await fetchAPI(`/categories/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        console.error(`Error deleting category ${id}:`, error);
        throw error;
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
        console.log(`[DEBUG] Starting file upload to Strapi for file "${file.name}"`);
        console.log(`[DEBUG] File details: size=${file.size} bytes, type=${file.type}, lastModified=${new Date(file.lastModified).toISOString()}`);
        
        const formData = new FormData();
        formData.append('files', file);
        
        // Log formData entries for debugging
        console.log(`[DEBUG] FormData entries:`);
        for (let [key, value] of formData.entries()) {
            console.log(`[DEBUG] - ${key}: ${value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value}`);
        }

        const url = `${STRAPI_API_URL}${API_PREFIX}/upload`;
        console.log(`[DEBUG] Upload URL: ${url}`);
        
        // Add request debug logs
        console.log(`[DEBUG] Making upload request to Strapi`);
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        console.log(`[DEBUG] Upload response status: ${response.status} ${response.statusText}`);
        console.log(`[DEBUG] Response headers:`, Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] ❌ File upload failed with status ${response.status}:`, errorText);
            try {
                // Try to parse as JSON to get more structured error info
                const errorJson = JSON.parse(errorText);
                console.error(`[DEBUG] ❌ Structured error:`, errorJson);
            } catch (e) {
                // Not JSON, already logged as text
            }
            throw new Error(`File upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[DEBUG] Upload response data type:`, Array.isArray(data) ? 'Array' : typeof data);
        console.log(`[DEBUG] Upload raw response:`, JSON.stringify(data, null, 2));

        // Strapi returns an array of uploaded files
        if (Array.isArray(data) && data.length > 0) {
            console.log(`[DEBUG] ✅ File uploaded successfully. Received ${data.length} file objects`);
            
            // Log detailed info about the first file
            const uploadedFile = data[0];
            console.log(`[DEBUG] Uploaded file details:`);
            console.log(`[DEBUG] - ID: ${uploadedFile.id}`);
            console.log(`[DEBUG] - Name: ${uploadedFile.name}`);
            console.log(`[DEBUG] - URL: ${uploadedFile.url}`);
            console.log(`[DEBUG] - MIME: ${uploadedFile.mime}`);
            
            // Check if formats are available (for images)
            if (uploadedFile.formats) {
                console.log(`[DEBUG] Image formats available:`, Object.keys(uploadedFile.formats).join(', '));
            }
            
            return uploadedFile;
        } else {
            console.error('[DEBUG] ❌ Unexpected upload response format:', data);
            throw new Error('Unexpected response format from upload API');
        }
    } catch (error) {
        console.error('[DEBUG] ❌ Error uploading file:', error);
        throw error;
    }
};
