// Access Sanity Content API directly using @sanity/client and @sanity/image-url
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Get Sanity configuration from environment variables
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';
const SANITY_API_TOKEN = import.meta.env.VITE_SANITY_API_TOKEN;
const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION || '2023-05-03';

/**
 * Initialize the Sanity client
 */
export const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION, // Use a UTC date string
  token: SANITY_API_TOKEN,
  useCdn: false, // Set to `true` for production
});

/**
 * Initialize the image URL builder
 */
const builder = imageUrlBuilder(client);

/**
 * Generate image URLs with Sanity's image pipeline
 * @param {Object} source - The image object from Sanity
 * @returns {Object} - An image URL builder object
 */
export function urlFor(source) {
  return builder.image(source);
}

/**
 * Fetch all categories
 * @returns {Promise<Array>} - Array of categories
 */
export const getCategories = async () => {
  try {
    // Use GROQ to query all categories, sorted by order
    const query = `*[_type == "category"] | order(order asc) {
      _id,
      name,
      order,
      thumbnail
    }`;
    
    const categories = await client.fetch(query);
    
    // Transform the data to match the expected structure in the UI components
    const transformedData = categories.map((category) => ({
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
    }));
    
    return transformedData;
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
export const getCategoryWithImages = async (nameOrId) => {
  try {
    // Check if it looks like a document ID
    const isDocumentId = typeof nameOrId === 'string' && nameOrId.length > 10;
    
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
    
    const category = await client.fetch(query, { identifier: nameOrId });
    
    if (!category) {
      return null;
    }
    
    // Transform the data to match the expected structure in the UI components
    const transformedCategory = {
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
        } : null,
        images: {
          data: category.images.map(image => ({
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
              }
            }
          }))
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
export const addCategory = async (categoryData) => {
  try {
    const category = {
      _type: 'category',
      name: categoryData.name,
      order: categoryData.order || 0
    };
    
    // If there's a thumbnail file, upload it
    if (categoryData.thumbnail) {
      // Handle file upload to Sanity
      const thumbnailAsset = await uploadFile(categoryData.thumbnail);
      category.thumbnail = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: thumbnailAsset._id
        }
      };
    }
    
    const createdCategory = await client.create(category);
    
    // Transform the response to match expected format
    const transformedCategory = {
      id: createdCategory._id,
      documentId: createdCategory._id,
      attributes: {
        name: createdCategory.name,
        order: createdCategory.order || 0,
        thumbnail: createdCategory.thumbnail ? {
          data: {
            attributes: {
              url: urlFor(createdCategory.thumbnail).url()
            }
          }
        } : null
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
 * @returns {Promise<null>} - Null on success
 */
export const deleteCategory = async (id) => {
  try {
    // Delete the category
    await client.delete(id);
    
    // Delete associated images (need to find them first)
    const imagesToDelete = await client.fetch(
      `*[_type == "galleryImage" && references($categoryId)]._id`,
      { categoryId: id }
    );
    
    // Delete each image one by one
    for (const imageId of imagesToDelete) {
      await client.delete(imageId);
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
export const updateCategory = async (id, data) => {
  try {
    // Handle the nested data structure from CategoryCard
    const categoryData = data.data || data;
    
    const updates = {
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
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // Update the document
    const updatedCategory = await client
      .patch(id)
      .set(cleanUpdates)
      .commit();
    
    // Transform the response to match expected format
    const transformedCategory = {
      id: updatedCategory._id,
      documentId: updatedCategory._id,
      attributes: {
        name: updatedCategory.name,
        order: updatedCategory.order || 0,
        thumbnail: updatedCategory.thumbnail ? {
          data: {
            attributes: {
              url: urlFor(updatedCategory.thumbnail).url()
            }
          }
        } : null
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
export const addImage = async (imageData) => {
  try {
    // Handle file upload to Sanity
    const imageAsset = await uploadFile(imageData.image);
    
    const image = {
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
    
    const createdImage = await client.create(image);
    
    // Transform the response to match expected format
    const transformedImage = {
      id: createdImage._id,
      documentId: createdImage._id,
      attributes: {
        order: createdImage.order || 0,
        image: {
          data: {
            attributes: {
              url: urlFor(createdImage.image).url()
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
export const deleteImage = async (id) => {
  try {
    await client.delete(id);
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
export const updateImage = async (id, data) => {
  try {
    console.log('[DEBUG] updateImage called with id:', id);
    console.log('[DEBUG] updateImage data:', JSON.stringify(data, null, 2));
    
    const updates = {
      order: data.order !== undefined ? data.order : undefined
    };
    
    console.log('[DEBUG] Prepared updates:', JSON.stringify(updates, null, 2));
    
    // If there's a new image file, upload it
    if (data.image && data.image instanceof File) {
      console.log('[DEBUG] New image file detected, uploading...');
      const imageAsset = await uploadFile(data.image);
      console.log('[DEBUG] Image upload complete, asset:', imageAsset._id);
      updates.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id
        }
      };
    }
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    console.log('[DEBUG] Clean updates to apply:', JSON.stringify(cleanUpdates, null, 2));
    
    // Update the document
    const updatedImage = await client
      .patch(id)
      .set(cleanUpdates)
      .commit();
    
    console.log('[DEBUG] Update successful, updatedImage:', JSON.stringify(updatedImage, null, 2));
    
    // Transform the response to match expected format
    const transformedImage = {
      id: updatedImage._id,
      documentId: updatedImage._id,
      attributes: {
        order: updatedImage.order || 0,
        image: {
          data: {
            attributes: {
              url: urlFor(updatedImage.image).url()
            }
          }
        }
      }
    };
    
    console.log('[DEBUG] Transformed response:', JSON.stringify(transformedImage, null, 2));
    
    return { data: transformedImage };
  } catch (error) {
    console.error('[DEBUG] Error updating image in Sanity:', error);
    throw error;
  }
};

/**
 * Upload a file to Sanity
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - The uploaded asset
 */
export const uploadFile = async (file) => {
  try {
    return client.assets.upload('image', file);
  } catch (error) {
    console.error('Error uploading file to Sanity:', error);
    throw error;
  }
}; 