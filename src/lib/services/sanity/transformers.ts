import { getImageUrls } from '../imageConfig';
import type { SanityCategory, SanityGalleryImage, FormattedCategory, FormattedImage, SanityImage } from './types';

/**
 * Transform a Sanity category to the format expected by UI components
 */
export function transformCategory(category: SanityCategory): FormattedCategory {
    // Generate the thumbnail URLs with safer handling
    let thumbnailUrl = '';
    let placeholderUrl = '';
    let fullSizeUrl = '';
    const passwordProtected = !!category.password;

    try {
        if (category.thumbnail) {
            // Use the centralized image configuration
            const urls = getImageUrls(category.thumbnail);
            thumbnailUrl = urls.medium;
            placeholderUrl = urls.placeholder;
            fullSizeUrl = urls.large;
        }
    } catch (error) {
        console.error('Error generating thumbnail URL for category:', category.name, error);
    }

    return {
        id: category._id,
        documentId: category._id,
        attributes: {
            name: category.name,
            order: category.order || 0,
            passwordProtected,
            thumbnail: category.thumbnail
                ? {
                      data: {
                          attributes: {
                              url: thumbnailUrl,
                              placeholderUrl: placeholderUrl,
                              fullSizeUrl: fullSizeUrl
                          }
                      }
                  }
                : null
        }
    };
}

/**
 * Transform a Sanity category with images to the format expected by UI components
 */
export function transformCategoryWithImages(
    category: SanityCategory & { images: SanityGalleryImage[] }
): FormattedCategory {
    const baseCategory = transformCategory(category);

    // Transform images
    const transformedImages = category.images.map(transformImage);

    return {
        ...baseCategory,
        attributes: {
            ...baseCategory.attributes,
            images: {
                data: transformedImages
            }
        }
    };
}

/**
 * Transform a Sanity gallery image to the format expected by UI components
 */
export function transformImage(image: SanityGalleryImage): FormattedImage {
    // Generate progressive image URLs with safe handling
    let imageUrl = '';
    let imagePlaceholderUrl = '';
    let imageFullSizeUrl = '';

    try {
        if (image.image) {
            // Use the centralized image configuration
            const imageUrls = getImageUrls(image.image);
            imageUrl = imageUrls.medium;
            imagePlaceholderUrl = imageUrls.placeholder;
            imageFullSizeUrl = imageUrls.large;
        }
    } catch (error) {
        console.error('Error generating progressive image URLs:', error);
    }

    return {
        id: image._id,
        documentId: image._id,
        attributes: {
            order: image.order || 0,
            spanTwoColumns: image.spanTwoColumns,
            image: {
                data: {
                    attributes: {
                        url: imageUrl,
                        placeholderUrl: imagePlaceholderUrl,
                        fullSizeUrl: imageFullSizeUrl
                    }
                }
            }
        }
    };
}

/**
 * Create a Sanity image object from an uploaded asset
 */
export function createSanityImageFromAsset(assetId: string): SanityImage {
    return {
        _type: 'image',
        asset: {
            _type: 'reference',
            _ref: assetId
        }
    };
}
