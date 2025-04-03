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
    console.log(`🔍 Making API request to: ${url}`);

    try {
        const response = await fetch(url, mergedOptions);
        console.log(`🔄 Response status: ${response.status}`);

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
        console.log(`✅ API response received, data type: ${typeof data}`);
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
    console.log('🔍 Fetching all categories...');
    try {
        const query = new URLSearchParams({
            populate: 'thumbnail'
        }).toString();

        const url = `${STRAPI_API_URL}${API_PREFIX}/categories?${query}`;
        console.log(`📡 Making API request to: ${url}`);

        const response = await fetchAPI(`/categories?${query}`);

        // Log the full response for debugging
        console.log('Raw categories response:', JSON.stringify(response));

        // Validate the response has the expected format
        if (!response.data || !Array.isArray(response.data)) {
            console.error('❌ Invalid categories response format:', response);
            return [];
        }

        console.log(`✅ Categories fetched successfully. Found ${response.data.length} categories`);

        // Transform the data to match the expected structure in the UI components
        const transformedData = response.data
            .map((category) => {
                // Check if the data already has the expected "attributes" structure
                if (category.attributes && typeof category.attributes === 'object') {
                    // If it's already in the right format, just return it
                    console.log(`Category ${category.id} already has attributes structure`);
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
                    console.log(`Transforming category ${category.id} to attributes structure`);
                    return {
                        id: category.id,
                        documentId: category.documentId,
                        attributes: {
                            name: category.name,
                            slug: category.slug,
                            description: category.description,
                            thumbnail: category.thumbnail
                        }
                    };
                }
                // Skip invalid entries
                else {
                    console.warn(`⚠️ Skipping category with ID ${category.id} due to invalid data`);
                    return null;
                }
            })
            .filter(Boolean); // Remove any null entries

        console.log(`✅ Transformed ${transformedData.length} categories for UI`);

        if (transformedData.length > 0) {
            console.log('First category structure:', JSON.stringify(transformedData[0], null, 2));
        }

        return transformedData;
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        return [];
    }
};

/**
 * Fetch a specific category with all its images
 * @param {string} slugOrId - The category slug or ID
 */
export const getCategoryWithImages = async (slugOrId) => {
    try {
        console.log(`🔍 Fetching category with slug or ID: '${slugOrId}'`);

        // Check if it looks like a documentId (alphanumeric string)
        const isDocumentId = typeof slugOrId === 'string' && /^[a-z0-9]+$/i.test(slugOrId) && slugOrId.length > 10;

        // Check if it's a numeric ID
        const isNumericId = !isNaN(parseInt(slugOrId, 10));

        let endpoint;
        let queryParams;

        if (isDocumentId) {
            // If it looks like a documentId, use filters to find by documentId
            console.log(`🔍 Using documentId lookup with ID: ${slugOrId}`);
            endpoint = '/categories';
            queryParams = new URLSearchParams({
                'filters[documentId][$eq]': slugOrId,
                populate: '*'
            }).toString();
        } else if (isNumericId) {
            // If it looks like a numeric ID, use direct ID lookup
            console.log(`🔍 Using direct ID lookup with ID: ${slugOrId}`);
            endpoint = `/categories/${slugOrId}`;
            queryParams = new URLSearchParams({
                populate: '*'
            }).toString();
        } else {
            // Otherwise, normalize the slug and use slug-based filtering
            const normalizedSlug = slugOrId.trim().toLowerCase();
            console.log(`🔍 Using slug-based filtering with normalized slug: '${normalizedSlug}'`);

            endpoint = '/categories';
            queryParams = new URLSearchParams({
                'filters[slug][$eq]': normalizedSlug,
                populate: '*'
            }).toString();
        }

        console.log(`🔄 Category query: ${endpoint}?${queryParams}`);

        const response = await fetchAPI(`${endpoint}?${queryParams}`);

        console.log(
            `✅ Category response received, data structure:`,
            JSON.stringify({
                hasData: isNumericId ? !!response.data : !!response.data && Array.isArray(response.data),
                dataLength: isNumericId ? 1 : response.data?.length || 0,
                meta: response.meta ? 'present' : 'missing'
            })
        );

        // Process the response based on whether we did ID lookup or filtering
        let category;

        if (isNumericId) {
            // ID lookup directly returns the category in data
            category = response.data;
            console.log(`📋 Found category by ID: ${category?.id || 'unknown'}`);
        } else {
            // Filtering returns an array of matches
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Get the first category that matches the slug
                category = response.data[0];
                console.log(`📋 Found category by slug: ${category?.id || 'unknown'}`);
            } else {
                console.warn(`⚠️ No category found with slug: ${slugOrId}`);
                return null;
            }
        }

        // Common processing code for both lookup methods
        console.log(`📋 Found raw category:`, JSON.stringify(category));

        // Step 1: Check if we have a flat structure (based on the logs we're seeing)
        if (category.name && category.slug && !category.attributes) {
            console.log(`Converting flat structure to attributes format`);

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
                console.log(`Processing images from flat structure`);
                if (Array.isArray(flatCategory.images)) {
                    category.attributes.images = {
                        data: flatCategory.images
                    };
                    console.log(`Converted ${flatCategory.images.length} images to nested structure`);
                } else {
                    // If images is not an array, create an empty data array
                    category.attributes.images = { data: [] };
                    console.log(`Images property was not an array, created empty array`);
                }
            } else {
                // No images property at all
                category.attributes.images = { data: [] };
                console.log(`No images property found, created empty array`);
            }
        }
        // If category.attributes exists and has expected structure, use that
        else if (category.attributes && typeof category.attributes === 'object') {
            console.log(`Using direct attributes from response`);
            // Already in the right format
        }
        // If category doesn't have attributes but has expected properties directly
        else if (category.name && category.slug) {
            console.log(`Converting direct properties to attributes format`);
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
            console.log(`⚠️ Creating minimal category structure`);
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
            console.log(`⚠️ Missing images property, creating empty array`);
            category.attributes.images = { data: [] };
        } else if (!category.attributes.images.data) {
            console.log(`⚠️ Images property is malformed, fixing structure`);
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
            console.log(`⚠️ Images data property is not an array, fixing structure`);
            category.attributes.images.data = [];
        }

        // Final validation log
        console.log(`Final category structure check:`, {
            hasId: !!category.id,
            hasAttributes: !!category.attributes,
            hasName: !!category.attributes?.name,
            hasImages: !!category.attributes?.images,
            hasImagesData: !!category.attributes?.images?.data,
            isImagesArray: Array.isArray(category.attributes?.images?.data)
        });

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
        console.log(`🔍 Adding new category:`, JSON.stringify(categoryData));

        // categoryData.data is already in the correct format for Strapi
        const response = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        if (!response.data) {
            console.error('❌ Invalid response from Strapi:', response);
            throw new Error('Failed to create category: Invalid response');
        }

        console.log(`✅ Category created successfully with ID: ${response.data.id}`);
        return response.data;
    } catch (error) {
        console.error('Error adding category:', error);
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
        // Log whether we're using the new categories.connect format or old category format
        if (imageData.categories && imageData.categories.connect) {
            console.log(`🔍 Adding new image with categories.connect format`);
        } else if (imageData.category) {
            console.log(`🔍 Adding new image to category ID: ${imageData.category}`);
        }

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

        console.log(`📤 Sending image data to Strapi:`, JSON.stringify(requestData));

        const response = await fetchAPI('/images', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        if (!response.data) {
            console.error('❌ Invalid response from Strapi:', response);
            throw new Error('Failed to create image: Invalid response');
        }

        console.log(`✅ Image created successfully:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error adding image:', error);
        throw error;
    }
};

/**
 * Delete an image
 * @param {string|number} id - The image documentId
 */
export const deleteImage = async (id) => {
    try {
        await fetchAPI(`/images/${id}`, {
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

        console.log(`🔼 Uploading file to Strapi: ${file.name} (${file.size} bytes)`);

        const response = await fetch(`${STRAPI_API_URL}${API_PREFIX}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ File upload failed with status ${response.status}:`, errorText);
            throw new Error(`File upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Upload response:`, JSON.stringify(data));

        // Strapi returns an array of uploaded files
        if (Array.isArray(data) && data.length > 0) {
            console.log(`✅ File uploaded successfully with ID: ${data[0].id}`);
            return data[0];
        } else {
            console.error('❌ Unexpected upload response format:', data);
            throw new Error('Unexpected response format from upload API');
        }
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        throw error;
    }
};

/**
 * Diagnose the Strapi relationship structure
 * This helps understand how relations should be formatted for your Strapi instance
 */
export const diagnoseRelationships = async () => {
    try {
        console.log('🔍 Diagnosing Strapi relationship structure...');

        // Try to fetch the content-type API to understand the schema
        try {
            console.log('Attempting to get content-type schema (may fail if access restricted)...');
            const contentTypeResponse = await fetch(
                `${STRAPI_API_URL}${API_PREFIX}/content-type-builder/content-types`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (contentTypeResponse.ok) {
                const data = await contentTypeResponse.json();
                console.log('Content-type schema available:', data);
                return { success: true, message: 'Content-type schema retrieved', data };
            } else {
                console.log('Content-type builder API restricted, trying alternative approach...');
            }
        } catch (e) {
            console.log('Content-type API not accessible, continuing with alternative diagnostics');
        }

        // Try to fetch a category with images to examine structure
        console.log('Fetching a category with images to analyze structure...');

        // First get all categories
        const categories = await getCategories();

        if (!categories || categories.length === 0) {
            return { success: false, message: 'No categories found to diagnose' };
        }

        // Get the first category with full population
        const categoryId = categories[0].id;
        const categoryResponse = await fetchAPI(`/categories/${categoryId}?populate=*`);

        console.log('Example category structure:', JSON.stringify(categoryResponse));

        // Get information about how relations are structured
        const relationStructure = {
            categoryHasImagesField: !!categoryResponse?.data?.attributes?.images,
            imagesFieldType: typeof categoryResponse?.data?.attributes?.images,
            isDirectArray: Array.isArray(categoryResponse?.data?.attributes?.images),
            hasDataProperty: !!categoryResponse?.data?.attributes?.images?.data,
            isDataArray: Array.isArray(categoryResponse?.data?.attributes?.images?.data),
            population: categoryResponse?.data?.attributes?.images?.data?.length || 0
        };

        console.log('Relation structure analysis:', relationStructure);

        // Try to fetch an image with category to see reverse relationship
        console.log('Fetching an image to analyze reverse relationship...');

        try {
            const imagesResponse = await fetchAPI('/images?populate=*&pagination[limit]=1');
            if (imagesResponse.data && imagesResponse.data.length > 0) {
                const image = imagesResponse.data[0];
                console.log('Example image structure:', JSON.stringify(image));

                const reverseRelationStructure = {
                    imageHasCategoryField: !!image.attributes?.category,
                    categoryFieldType: typeof image.attributes?.category,
                    isDirectId: typeof image.attributes?.category === 'number',
                    hasDataProperty: !!image.attributes?.category?.data,
                    hasCategoryId: !!image.attributes?.category?.data?.id
                };

                console.log('Reverse relation structure analysis:', reverseRelationStructure);
            }
        } catch (imageError) {
            console.log('Could not fetch image data for analysis');
        }

        return {
            success: true,
            message: 'Diagnostic complete, check console logs',
            relationStructure
        };
    } catch (error) {
        console.error('Error during relationship diagnosis:', error);
        return { success: false, message: 'Diagnosis failed', error: error.message };
    }
};
