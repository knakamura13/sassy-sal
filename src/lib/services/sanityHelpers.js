// Helper functions for working with Sanity queries
import { client, urlFor } from './sanity';

/**
 * Get all categories with optimized query shape
 * @returns {Promise<Array>} Array of formatted categories
 */
export const getAllCategories = async () => {
  const query = `*[_type == "category"] | order(order asc) {
    _id,
    name,
    order,
    thumbnail
  }`;
  
  return client.fetch(query).then(categories => 
    categories.map(formatCategory)
  );
};

/**
 * Get latest categories with an optional limit
 * @param {number} limit - Number of categories to return
 * @returns {Promise<Array>} Array of formatted categories
 */
export const getLatestCategories = async (limit = 10) => {
  const query = `*[_type == "category"] | order(_createdAt desc)[0...${limit}] {
    _id,
    name,
    order,
    thumbnail
  }`;
  
  return client.fetch(query).then(categories => 
    categories.map(formatCategory)
  );
};

/**
 * Get a category by ID with all its images
 * @param {string} id - Category ID
 * @returns {Promise<Object>} Category with images
 */
export const getCategoryById = async (id) => {
  const query = `*[_type == "category" && _id == $id][0] {
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
  
  return client.fetch(query, { id }).then(category => 
    category ? formatCategoryWithImages(category) : null
  );
};

/**
 * Get a category by name with all its images
 * @param {string} name - Category name
 * @returns {Promise<Object>} Category with images
 */
export const getCategoryByName = async (name) => {
  const query = `*[_type == "category" && name == $name][0] {
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
  
  return client.fetch(query, { name }).then(category => 
    category ? formatCategoryWithImages(category) : null
  );
};

/**
 * Get all images across all categories
 * @returns {Promise<Array>} Array of formatted images
 */
export const getAllImages = async () => {
  const query = `*[_type == "galleryImage"] | order(order asc) {
    _id,
    order,
    image,
    "category": *[_type == "category" && _id == ^.category._ref][0] {
      _id, 
      name
    }
  }`;
  
  return client.fetch(query).then(images => 
    images.map(formatImage)
  );
};

/**
 * Get images by category ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of formatted images
 */
export const getImagesByCategoryId = async (categoryId) => {
  const query = `*[_type == "galleryImage" && category._ref == $categoryId] | order(order asc) {
    _id,
    order,
    image
  }`;
  
  return client.fetch(query, { categoryId }).then(images => 
    images.map(formatImage)
  );
};

/**
 * Check if image exists in category
 * @param {string} imageId - Image ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<boolean>} Whether the image exists in the category
 */
export const imageExistsInCategory = async (imageId, categoryId) => {
  const query = `count(*[_type == "galleryImage" && _id == $imageId && category._ref == $categoryId])`;
  return client.fetch(query, { imageId, categoryId }).then(count => count > 0);
};

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @param {string} excludeId - Optional ID to exclude from check (for updates)
 * @returns {Promise<boolean>} Whether the name exists
 */
export const categoryNameExists = async (name, excludeId = null) => {
  const query = excludeId 
    ? `count(*[_type == "category" && name == $name && _id != $excludeId])`
    : `count(*[_type == "category" && name == $name])`;
  
  return client.fetch(query, { name, excludeId }).then(count => count > 0);
};

/**
 * Get the highest order value in categories
 * @returns {Promise<number>} Highest order value
 */
export const getHighestCategoryOrder = async () => {
  const query = `*[_type == "category"] | order(order desc)[0].order`;
  return client.fetch(query).then(order => order || 0);
};

/**
 * Get the highest order value in images for a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<number>} Highest order value
 */
export const getHighestImageOrder = async (categoryId) => {
  const query = `*[_type == "galleryImage" && category._ref == $categoryId] | order(order desc)[0].order`;
  return client.fetch(query, { categoryId }).then(order => order || 0);
};

/**
 * Format a category for consistent API structure
 * @param {Object} category - Sanity category object
 * @returns {Object} Formatted category
 */
export const formatCategory = (category) => {
  if (!category) return null;
  
  return {
    id: category._id,
    documentId: category._id,
    attributes: {
      name: category.name,
      order: category.order || 0,
      thumbnail: category.thumbnail ? {
        data: {
          attributes: {
            url: urlFor(category.thumbnail).url()
          }
        }
      } : null
    }
  };
};

/**
 * Format a category with images for consistent API structure
 * @param {Object} category - Sanity category object with images
 * @returns {Object} Formatted category with images
 */
export const formatCategoryWithImages = (category) => {
  if (!category) return null;
  
  const formattedCategory = formatCategory(category);
  
  if (category.images && Array.isArray(category.images)) {
    formattedCategory.attributes.images = {
      data: category.images.map(formatImage)
    };
  }
  
  return {
    data: formattedCategory
  };
};

/**
 * Format an image for consistent API structure
 * @param {Object} image - Sanity image object
 * @returns {Object} Formatted image
 */
export const formatImage = (image) => {
  if (!image) return null;
  
  return {
    id: image._id,
    documentId: image._id,
    attributes: {
      order: image.order || 0,
      image: {
        data: {
          attributes: {
            url: urlFor(image.image).url()
          }
        }
      },
      category: image.category ? {
        data: {
          id: image.category._id,
          attributes: {
            name: image.category.name
          }
        }
      } : null
    }
  };
}; 