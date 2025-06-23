/**
 * Centralized configuration for Sanity image URLs
 * This file provides standardized image size and quality settings across the application
 */
import { urlFor as baseSanityUrlFor } from './sanity/client';

// Image size configurations
export const IMAGE_SIZES = {
    // Tiny placeholder images (for initial loading)
    PLACEHOLDER: {
        width: 200,
        quality: 60
    },
    // Small thumbnail images
    THUMBNAIL: {
        width: 300,
        quality: 60
    },
    // Medium-sized images (standard display)
    MEDIUM: {
        width: 600,
        quality: 70
    },
    // Large images (lightbox/detailed view)
    LARGE: {
        width: 1200,
        quality: 100
    },
    // Responsive image sizes
    RESPONSIVE: {
        SMALL: {
            width: 640,
            quality: 75
        },
        MEDIUM: {
            width: 1080,
            quality: 80
        },
        LARGE: {
            width: 1920,
            quality: 100
        }
    }
};

/**
 * Generate a placeholder image URL
 * @param source - Sanity image source
 * @returns URL string for the placeholder image
 */
export function getPlaceholderUrl(source: any): string {
    if (!source) return '';
    return baseSanityUrlFor(source)
        .width(IMAGE_SIZES.PLACEHOLDER.width)
        .auto('format')
        .quality(IMAGE_SIZES.PLACEHOLDER.quality)
        .url();
}

/**
 * Generate a thumbnail image URL
 * @param source - Sanity image source
 * @returns URL string for the thumbnail image
 */
export function getThumbnailUrl(source: any): string {
    if (!source) return '';
    return baseSanityUrlFor(source)
        .width(IMAGE_SIZES.THUMBNAIL.width)
        .auto('format')
        .quality(IMAGE_SIZES.THUMBNAIL.quality)
        .url();
}

/**
 * Generate a medium image URL
 * @param source - Sanity image source
 * @returns URL string for the medium image
 */
export function getMediumUrl(source: any): string {
    if (!source) return '';
    return baseSanityUrlFor(source)
        .width(IMAGE_SIZES.MEDIUM.width)
        .auto('format')
        .quality(IMAGE_SIZES.MEDIUM.quality)
        .url();
}

/**
 * Generate a large image URL
 * @param source - Sanity image source
 * @returns URL string for the large image
 */
export function getLargeUrl(source: any): string {
    if (!source) return '';
    return baseSanityUrlFor(source)
        .width(IMAGE_SIZES.LARGE.width)
        .auto('format')
        .quality(IMAGE_SIZES.LARGE.quality)
        .url();
}

/**
 * Generate a set of responsive image URLs
 * @param source - Sanity image source
 * @returns Object containing URLs for each responsive size
 */
export function getResponsiveUrls(source: any): { small: string; medium: string; large: string } {
    if (!source) return { small: '', medium: '', large: '' };

    return {
        small: baseSanityUrlFor(source)
            .width(IMAGE_SIZES.RESPONSIVE.SMALL.width)
            .auto('format')
            .quality(IMAGE_SIZES.RESPONSIVE.SMALL.quality)
            .url(),
        medium: baseSanityUrlFor(source)
            .width(IMAGE_SIZES.RESPONSIVE.MEDIUM.width)
            .auto('format')
            .quality(IMAGE_SIZES.RESPONSIVE.MEDIUM.quality)
            .url(),
        large: baseSanityUrlFor(source)
            .width(IMAGE_SIZES.RESPONSIVE.LARGE.width)
            .auto('format')
            .quality(IMAGE_SIZES.RESPONSIVE.LARGE.quality)
            .url()
    };
}

/**
 * Generate all image URLs for an image
 * @param source - Sanity image source
 * @returns Object containing URLs for all image sizes
 */
export function getImageUrls(source: any): {
    placeholder: string;
    thumbnail: string;
    medium: string;
    large: string;
    responsive: { small: string; medium: string; large: string };
} {
    if (!source) {
        return {
            placeholder: '',
            thumbnail: '',
            medium: '',
            large: '',
            responsive: { small: '', medium: '', large: '' }
        };
    }

    return {
        placeholder: getPlaceholderUrl(source),
        thumbnail: getThumbnailUrl(source),
        medium: getMediumUrl(source),
        large: getLargeUrl(source),
        responsive: getResponsiveUrls(source)
    };
}

// For direct access to urlFor with builder pattern
export { baseSanityUrlFor as urlForBuilder };
