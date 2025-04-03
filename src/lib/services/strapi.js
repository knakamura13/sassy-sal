import Strapi from 'strapi-sdk-js';

// Get Strapi URL from environment variable, fallback to hardcoded URL if not set
const STRAPI_API_URL = import.meta.env.STRAPI_API_URL || 'https://strapi-production-9ab9.up.railway.app';

// Initialize Strapi client with the URL
const strapi = new Strapi({
    url: STRAPI_API_URL,
    prefix: '/api',
    store: {
        key: 'strapi_jwt',
        useLocalStorage: true,
        cookieOptions: { path: '/' }
    },
    axiosOptions: {}
});

/**
 * Fetch all categories
 */
export const getCategories = async () => {
    try {
        const response = await strapi.find('categories', {
            populate: {
                thumbnail: true
            }
        });
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
        const response = await strapi.find('categories', {
            filters: {
                slug: {
                    $eq: slug
                }
            },
            populate: {
                images: {
                    populate: {
                        image: true
                    }
                }
            }
        });

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
        const response = await strapi.create('categories', {
            data: categoryData
        });
        return response.data;
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
};

/**
 * Delete a category
 * @param {number} id - The category ID
 */
export const deleteCategory = async (id) => {
    try {
        const response = await strapi.delete('categories', id);
        return response.data;
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
        const response = await strapi.create('images', {
            data: imageData
        });
        return response.data;
    } catch (error) {
        console.error('Error adding image:', error);
        throw error;
    }
};

/**
 * Delete an image
 * @param {number} id - The image ID
 */
export const deleteImage = async (id) => {
    try {
        const response = await strapi.delete('images', id);
        return response.data;
    } catch (error) {
        console.error(`Error deleting image ${id}:`, error);
        throw error;
    }
};

export default strapi;
