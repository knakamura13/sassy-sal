import type { Image } from '$lib/stores/imageStore';

/**
 * Sort images by order and then by title as a fallback
 */
export function sortImagesByOrder(images: Image[]): Image[] {
    return [...images].sort((a, b) => {
        // Primary sort by order (ascending)
        // Make sure we're comparing numbers
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        const orderDiff = orderA - orderB;

        if (orderDiff !== 0) return orderDiff;

        // Secondary sort by title for consistent ordering when order is the same
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
    });
}

/**
 * Initialize images with sequential order if missing
 */
export function ensureImageOrder(images: Image[]): Image[] {
    return images.map((img, index) => {
        if (img.order === undefined || img.order === null) {
            return { ...img, order: index };
        }
        return { ...img };
    });
}

/**
 * Deep clone an array of images to avoid reference issues
 */
export function cloneImages(images: Image[]): Image[] {
    return images.map((img) => ({ ...img }));
}

/**
 * Find differences between original and current images
 */
export function findImageChanges(
    localImages: Image[],
    originalImages: Image[]
): {
    imagesToAdd: Image[];
    imagesToRemove: Image[];
    imagesToUpdate: Image[];
} {
    // Find images to add
    const imagesToAdd = localImages.filter((local) => !originalImages.some((orig) => orig.id === local.id));

    // Find images to remove
    const imagesToRemove = originalImages.filter((orig) => !localImages.some((local) => local.id === orig.id));

    // Find images with changes (order or file)
    const imagesToUpdate = localImages.filter((local) => {
        const orig = originalImages.find((o) => o.id === local.id);
        if (!orig) return false;

        // Convert both to numbers for proper comparison
        const localOrder = typeof local.order === 'number' ? local.order : Number(local.order || 0);
        const origOrder = typeof orig.order === 'number' ? orig.order : Number(orig.order || 0);

        // Check if order changed
        const orderChanged = localOrder !== origOrder;

        // Check if file changed
        const fileChanged = !!local.file;

        // Check if spanTwoColumns changed
        const spanTwoColumnsChanged = local.spanTwoColumns !== orig.spanTwoColumns;

        // Return true if order, file, or spanTwoColumns changed
        return orderChanged || fileChanged || spanTwoColumnsChanged;
    });

    return { imagesToAdd, imagesToRemove, imagesToUpdate };
}
