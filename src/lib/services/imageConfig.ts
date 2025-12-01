/**
 * Centralized configuration for Sanity image URLs
 * This file provides standardized image size and quality settings across the application
 */
import { urlFor as baseSanityUrlFor } from './sanity/client';

// Hard limits to prevent oversized requests
const MAX_DIMENSION = 2560;

const clamp = (value: number, max: number = MAX_DIMENSION) => Math.min(value, max);

type ImgFormat = 'auto' | 'webp' | 'avif';

const buildUrl = (source: any, width: number, quality: number, format: ImgFormat = 'auto') => {
    if (!source) return '';
    let builder = baseSanityUrlFor(source).width(clamp(width)).fit('max').quality(quality);
    if (format === 'auto') {
        builder = builder.auto('format');
    } else {
        builder = builder.format(format as any);
    }
    return builder.url();
};

// Image size configurations
export const IMAGE_SIZES = {
    // Tiny placeholder images (for initial loading)
    PLACEHOLDER: {
        // Very small + low quality on purpose so blur-up stays lightweight
        width: 32,
        quality: 20
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
    // Prefer Sanity-provided LQIP when available
    const lqip = source?.asset?.metadata?.lqip;
    if (typeof lqip === 'string' && lqip.startsWith('data:image')) {
        return lqip;
    }

    return buildUrl(source, IMAGE_SIZES.PLACEHOLDER.width, IMAGE_SIZES.PLACEHOLDER.quality, 'auto');
}

/**
 * Generate a thumbnail image URL
 * @param source - Sanity image source
 * @returns URL string for the thumbnail image
 */
export function getThumbnailUrl(source: any): string {
    return buildUrl(source, IMAGE_SIZES.THUMBNAIL.width, IMAGE_SIZES.THUMBNAIL.quality, 'auto');
}

/**
 * Generate a medium image URL
 * @param source - Sanity image source
 * @returns URL string for the medium image
 */
export function getMediumUrl(source: any): string {
    return buildUrl(source, IMAGE_SIZES.MEDIUM.width, IMAGE_SIZES.MEDIUM.quality, 'auto');
}

/**
 * Generate a large image URL
 * @param source - Sanity image source
 * @returns URL string for the large image
 */
export function getLargeUrl(source: any): string {
    return buildUrl(source, IMAGE_SIZES.LARGE.width, IMAGE_SIZES.LARGE.quality, 'auto');
}

/**
 * Generate a set of responsive image URLs
 * @param source - Sanity image source
 * @returns Object containing URLs for each responsive size
 */
export function getResponsiveUrls(source: any): { small: string; medium: string; large: string } {
    if (!source) return { small: '', medium: '', large: '' };

    return {
        small: buildUrl(source, IMAGE_SIZES.RESPONSIVE.SMALL.width, IMAGE_SIZES.RESPONSIVE.SMALL.quality, 'auto'),
        medium: buildUrl(source, IMAGE_SIZES.RESPONSIVE.MEDIUM.width, IMAGE_SIZES.RESPONSIVE.MEDIUM.quality, 'auto'),
        large: buildUrl(source, IMAGE_SIZES.RESPONSIVE.LARGE.width, IMAGE_SIZES.RESPONSIVE.LARGE.quality, 'auto')
    };
}

function getResponsiveUrlsForFormat(source: any, format: ImgFormat) {
    if (!source) return { small: '', medium: '', large: '' };
    return {
        small: buildUrl(source, IMAGE_SIZES.RESPONSIVE.SMALL.width, IMAGE_SIZES.RESPONSIVE.SMALL.quality, format),
        medium: buildUrl(source, IMAGE_SIZES.RESPONSIVE.MEDIUM.width, IMAGE_SIZES.RESPONSIVE.MEDIUM.quality, format),
        large: buildUrl(source, IMAGE_SIZES.RESPONSIVE.LARGE.width, IMAGE_SIZES.RESPONSIVE.LARGE.quality, format)
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
    webp: {
        thumbnail: string;
        medium: string;
        large: string;
        responsive: { small: string; medium: string; large: string };
    };
    avif: {
        thumbnail: string;
        medium: string;
        large: string;
        responsive: { small: string; medium: string; large: string };
    };
} {
    if (!source) {
        return {
            placeholder: '',
            thumbnail: '',
            medium: '',
            large: '',
            responsive: { small: '', medium: '', large: '' },
            webp: {
                thumbnail: '',
                medium: '',
                large: '',
                responsive: { small: '', medium: '', large: '' }
            },
            avif: {
                thumbnail: '',
                medium: '',
                large: '',
                responsive: { small: '', medium: '', large: '' }
            }
        };
    }

    const responsive = getResponsiveUrls(source);
    const responsiveWebp = getResponsiveUrlsForFormat(source, 'webp');
    const responsiveAvif = getResponsiveUrlsForFormat(source, 'avif');

    return {
        placeholder: getPlaceholderUrl(source),
        thumbnail: getThumbnailUrl(source),
        medium: getMediumUrl(source),
        large: getLargeUrl(source),
        responsive,
        webp: {
            thumbnail: buildUrl(source, IMAGE_SIZES.THUMBNAIL.width, IMAGE_SIZES.THUMBNAIL.quality, 'webp'),
            medium: buildUrl(source, IMAGE_SIZES.MEDIUM.width, IMAGE_SIZES.MEDIUM.quality, 'webp'),
            large: buildUrl(source, IMAGE_SIZES.LARGE.width, IMAGE_SIZES.LARGE.quality, 'webp'),
            responsive: responsiveWebp
        },
        avif: {
            thumbnail: buildUrl(source, IMAGE_SIZES.THUMBNAIL.width, IMAGE_SIZES.THUMBNAIL.quality, 'avif'),
            medium: buildUrl(source, IMAGE_SIZES.MEDIUM.width, IMAGE_SIZES.MEDIUM.quality, 'avif'),
            large: buildUrl(source, IMAGE_SIZES.LARGE.width, IMAGE_SIZES.LARGE.quality, 'avif'),
            responsive: responsiveAvif
        }
    };
}

// For direct access to urlFor with builder pattern
export { baseSanityUrlFor as urlForBuilder };
