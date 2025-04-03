// Access Strapi REST API directly using fetch
// Based on Strapi documentation: https://docs.strapi.io/cms/api/rest

// Get Strapi URL from environment variable, fallback to hardcoded URL if not set
const STRAPI_API_URL = import.meta.env.STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';
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
            const error = await response.json();
            throw new Error(error.error?.message || 'An error occurred');
        }

        // For DELETE requests which don't return content
        if (response.status === 204) {
            return null;
        }

        return await response.json();
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
        const query = new URLSearchParams({
            populate: 'thumbnail'
        }).toString();

        const response = await fetchAPI(`/categories?${query}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

/**
 * Fetch a specific category with all its images
 * @param {string} slug - The category slug
 */
export const getCategoryWithImages = async (slug) => {
    try {
        // Using the filter parameter to find by slug
        const query = new URLSearchParams({
            'filters[slug][$eq]': slug,
            'populate[images][populate][0]': 'image'
        }).toString();

        const response = await fetchAPI(`/categories?${query}`);

        if (response.data && response.data.length > 0) {
            return response.data[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching category ${slug}:`, error);
        return null;
    }
};

/**
 * Add a new category
 * @param {Object} categoryData - The category data
 */
export const addCategory = async (categoryData) => {
    try {
        const response = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify({
                data: categoryData
            })
        });
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
 * Add an image to a category
 * @param {Object} imageData - The image data including category relation
 */
export const addImage = async (imageData) => {
    try {
        const response = await fetchAPI('/images', {
            method: 'POST',
            body: JSON.stringify({
                data: imageData
            })
        });
        return response.data;
    } catch (error) {
        console.error('Error adding image:', error);
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

        const response = await fetch(`${STRAPI_API_URL}${API_PREFIX}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        const data = await response.json();
        return data[0]; // Strapi returns an array of uploaded files
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};
