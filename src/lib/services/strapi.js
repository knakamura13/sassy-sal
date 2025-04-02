import Strapi from 'strapi-sdk-js';

// Initialize Strapi client with your Strapi instance URL
// Replace with your actual Strapi URL on Railway
const strapiUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const strapi = new Strapi({
    url: strapiUrl,
    prefix: '/api',
    store: {
        key: 'strapi_jwt',
        useLocalStorage: true,
        cookieOptions: { path: '/' }
    },
    axiosOptions: {}
});

/**
 * Authenticate with Strapi
 * @param {string} identifier - Email or username
 * @param {string} password - Password
 */
export const login = async (identifier, password) => {
    try {
        const response = await strapi.login({ identifier, password });
        return response;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Fetch all categories
 */
export const getCategories = async () => {
    try {
        const response = await strapi.find('categories', {
            populate: ['thumbnail']
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

/**
 * Fetch a single category with its images
 * @param {string} slug - The category slug
 */
export const getCategoryWithImages = async (slug) => {
    try {
        const response = await strapi.find('categories', {
            filters: { slug: { $eq: slug } },
            populate: ['images', 'images.image']
        });

        return response.data?.[0] || null;
    } catch (error) {
        console.error(`Error fetching category ${slug}:`, error);
        return null;
    }
};

/**
 * Create a new category
 * @param {Object} categoryData - The category data
 * @param {File} thumbnailFile - The thumbnail image file
 */
export const createCategory = async (categoryData, thumbnailFile) => {
    try {
        // First upload the thumbnail
        const formData = new FormData();
        formData.append('files', thumbnailFile);
        const uploadedFiles = await strapi.upload(formData);

        // Then create the category with the thumbnail
        return await strapi.create('categories', {
            ...categoryData,
            thumbnail: uploadedFiles[0].id
        });
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

/**
 * Add images to a category
 * @param {number} categoryId - The category ID
 * @param {Array} imageFiles - Array of image files to upload
 */
export const addImagesToCategory = async (categoryId, imageFiles) => {
    try {
        // First upload the images
        const uploadPromises = imageFiles.map((file) => {
            const formData = new FormData();
            formData.append('files', file);
            return strapi.upload(formData);
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Then create image entries linked to the category
        const imageEntries = uploadedFiles.flat().map((file) => ({
            title: file.name,
            alt: file.name,
            image: file.id,
            category: categoryId
        }));

        // Create image entries in bulk
        return await strapi.create('images', imageEntries);
    } catch (error) {
        console.error('Error adding images:', error);
        throw error;
    }
};

/**
 * Delete a category
 * @param {number} id - The category ID
 */
export const deleteCategory = async (id) => {
    try {
        return await strapi.delete('categories', id);
    } catch (error) {
        console.error(`Error deleting category ${id}:`, error);
        throw error;
    }
};

/**
 * Delete an image
 * @param {number} id - The image ID
 */
export const deleteImage = async (id) => {
    try {
        return await strapi.delete('images', id);
    } catch (error) {
        console.error(`Error deleting image ${id}:`, error);
        throw error;
    }
};

export default strapi;
