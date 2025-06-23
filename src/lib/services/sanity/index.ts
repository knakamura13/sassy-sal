// Main entry point for Sanity services
// Provides a clean, modular API for all Sanity operations

// Re-export client and URL builder
export { client, urlFor, isBrowser } from './client';

// Re-export all types
export type * from './types';

// Re-export category service functions
export { getCategories, getCategoryWithImages, addCategory, deleteCategory, updateCategory } from './categoryService';

// Re-export image service functions
export { addImage, deleteImage, updateImage } from './imageService';

// Re-export upload service
export { uploadFile } from './uploadService';

// Re-export transformers for advanced use cases
export {
    transformCategory,
    transformCategoryWithImages,
    transformImage,
    createSanityImageFromAsset
} from './transformers';
