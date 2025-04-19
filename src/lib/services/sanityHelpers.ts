// Helper functions for working with Sanity queries
import { client, urlFor } from './sanity';

/**
 * Get all categories with optimized query shape
 * @returns {Promise<Array>} Array of formatted categories
 */
export const getAllCategories = async (): Promise<any[]> => {
    const query = `*[_type == "category"] | order(order asc) {
    _id,
    name,
    order,
    thumbnail
  }`;

    return client.fetch(query).then((categories: any[]) => categories.map(formatCategory));
};

/**
 * Get latest categories with an optional limit
 * @param {number} limit - Number of categories to return
 * @returns {Promise<Array>} Array of formatted categories
 */
export const getLatestCategories = async (limit: number = 10): Promise<any[]> => {
    const query = `*[_type == "category"] | order(_createdAt desc)[0...${limit}] {
    _id,
    name,
    order,
    thumbnail
  }`;

    return client.fetch(query).then((categories: any[]) => categories.map(formatCategory));
};

/**
 * Get a category by ID with all its images
 * @param {string} id - Category ID
 * @returns {Promise<Object>} Category with images
 */
export const getCategoryById = async (id: string): Promise<any | null> => {
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

    return client.fetch(query, { id }).then((category: any) => (category ? formatCategoryWithImages(category) : null));
};

/**
 * Get a category by name with all its images
 * @param {string} name - Category name
 * @returns {Promise<Object>} Category with images
 */
export const getCategoryByName = async (name: string): Promise<any | null> => {
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

    return client.fetch(query, { name }).then((category: any) => (category ? formatCategoryWithImages(category) : null));
};

/**
 * Get all images across all categories
 * @returns {Promise<Array>} Array of formatted images
 */
export const getAllImages = async (): Promise<any[]> => {
    const query = `*[_type == "galleryImage"] | order(order asc) {
    _id,
    order,
    image,
    "category": *[_type == "category" && _id == ^.category._ref][0] {
      _id, 
      name
    }
  }`;

    return client.fetch(query).then((images: any[]) => images.map(formatImage));
};

/**
 * Get images by category ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of formatted images
 */
export const getImagesByCategoryId = async (categoryId: string): Promise<any[]> => {
    const query = `*[_type == "galleryImage" && category._ref == $categoryId] | order(order asc) {
    _id,
    order,
    image
  }`;

    return client.fetch(query, { categoryId }).then((images: any[]) => images.map(formatImage));
};

/**
 * Check if image exists in category
 * @param {string} imageId - Image ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<boolean>} Whether the image exists in the category
 */
export const imageExistsInCategory = async (imageId: string, categoryId: string): Promise<boolean> => {
    const query = `count(*[_type == "galleryImage" && _id == $imageId && category._ref == $categoryId])`;
    return client.fetch(query, { imageId, categoryId }).then((count: number) => count > 0);
};

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @param {string} excludeId - Optional ID to exclude from check (for updates)
 * @returns {Promise<boolean>} Whether the name exists
 */
export const categoryNameExists = async (name: string, excludeId: string | null = null): Promise<boolean> => {
    const query = excludeId
        ? `count(*[_type == "category" && name == $name && _id != $excludeId])`
        : `count(*[_type == "category" && name == $name])`;

    return client.fetch(query, { name, excludeId }).then((count: number) => count > 0);
};

/**
 * Get the highest order value in categories
 * @returns {Promise<number>} Highest order value
 */
export const getHighestCategoryOrder = async (): Promise<number> => {
    const query = `*[_type == "category"] | order(order desc)[0].order`;
    return client.fetch(query).then((order: number | null) => order || 0);
};

/**
 * Get the highest order value in images for a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<number>} Highest order value
 */
export const getHighestImageOrder = async (categoryId: string): Promise<number> => {
    const query = `*[_type == "galleryImage" && category._ref == $categoryId] | order(order desc)[0].order`;
    return client.fetch(query, { categoryId }).then((order: number | null) => order || 0);
};

// Define interfaces for the different data structures
interface SanityImage {
    _type: string;
    asset: {
        _ref: string;
        _type: string;
    };
}

interface SanityCategory {
    _id: string;
    name: string;
    order?: number;
    thumbnail?: SanityImage;
    images?: SanityGalleryImage[];
}

interface SanityGalleryImage {
    _id: string;
    order?: number;
    image: SanityImage;
    category?: {
        _id: string;
        name: string;
    };
}

interface FormattedCategory {
    id: string;
    attributes: {
        name: string;
        order: number;
        thumbnail: {
            data: {
                attributes: {
                    url: string;
                    blurDataURL: string;
                    width: number;
                    height: number;
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
    attributes: {
        order: number;
        image: {
            data: {
                attributes: {
                    url: string;
                    blurDataURL: string;
                    responsive: {
                        small: string;
                        medium: string;
                        large: string;
                    };
                };
            };
        };
        category: {
            data: {
                id: string;
                attributes: {
                    name: string;
                };
            };
        } | null;
    };
}

// Add a type for the urlFor function return value
interface UrlForResult {
    url: () => string;
}

/**
 * Format a category for consistent API structure
 * @param {Object} category - Sanity category object
 * @returns {Object} Formatted category
 */
export const formatCategory = (category: SanityCategory | null): FormattedCategory | null => {
    if (!category) return null;

    return {
        id: category._id,
        attributes: {
            name: category.name,
            order: category.order || 0,
            thumbnail: category.thumbnail
                ? {
                    data: {
                        attributes: {
                            url: urlFor(category.thumbnail)
                                .width(400)
                                .auto('format')
                                .quality(80)
                                .url(),
                            blurDataURL: urlFor(category.thumbnail)
                                .width(20)
                                .blur(10)
                                .quality(20)
                                .url(),
                            width: 400,
                            height: 400,
                        }
                    }
                }
                : null
        }
    };
};

/**
 * Format a category with images for consistent API structure
 * @param {Object} category - Sanity category object with images
 * @returns {Object} Formatted category with images
 */
export const formatCategoryWithImages = (category: SanityCategory | null): { data: FormattedCategory | null } => {
    if (!category) return { data: null };

    const formattedCategory = formatCategory(category);

    if (formattedCategory && category.images && Array.isArray(category.images)) {
        formattedCategory.attributes.images = {
            data: category.images.map(formatImage).filter((image): image is FormattedImage => image !== null)
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
export const formatImage = (image: SanityGalleryImage | null): FormattedImage | null => {
    if (!image) return null;

    return {
        id: image._id,
        attributes: {
            order: image.order || 0,
            image: {
                data: {
                    attributes: {
                        url: urlFor(image.image)
                            .auto('format')
                            .quality(80)
                            .url(),
                        // Low-quality placeholder for progressive loading
                        blurDataURL: urlFor(image.image)
                            .width(20)
                            .blur(10)
                            .quality(20)
                            .url(),
                        // Responsive image sources
                        responsive: {
                            small: urlFor(image.image).width(640).quality(75).auto('format').url(),
                            medium: urlFor(image.image).width(1080).quality(80).auto('format').url(),
                            large: urlFor(image.image).width(1920).quality(80).auto('format').url(),
                        }
                    }
                }
            },
            category: image.category
                ? {
                    data: {
                        id: image.category._id,
                        attributes: {
                            name: image.category.name
                        }
                    }
                }
                : null
        }
    };
}; 