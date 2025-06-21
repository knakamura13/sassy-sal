import { tick } from 'svelte';
import type { Image } from '$lib/stores/imageStore';
import { showToast } from '$lib/utils';

export class CDNCacheManager {
    private useCdn: boolean;
    private categoryId: string;
    private cacheKey: string;
    private cachedLocalImages: Record<string, Image> = {};
    private cacheInitialized = false;
    private checkCdnStatusInterval: ReturnType<typeof setInterval> | null = null;

    constructor(categoryId: string, useCdn: boolean = false) {
        this.categoryId = categoryId;
        this.useCdn = useCdn;
        this.cacheKey = `sanity-image-cache-${categoryId}`;
    }

    // Load cached images from session storage
    loadCachedImages(): Image[] {
        if (this.cacheInitialized || !this.useCdn) {
            return [];
        }

        const addedImages: Image[] = [];

        try {
            const cacheData = sessionStorage.getItem(this.cacheKey);
            if (cacheData) {
                this.cachedLocalImages = JSON.parse(cacheData);

                // Convert cached images to proper Image objects
                for (const [id, cachedImage] of Object.entries(this.cachedLocalImages)) {
                    const imageToAdd: Image = {
                        ...(cachedImage as Image),
                        id: id,
                        // Use the CDN URL directly if available, otherwise use a placeholder
                        url: cachedImage.cdnUrl || '/placeholder.png',
                        thumbnailUrl: cachedImage.cdnUrl || '/placeholder.png',
                        fullSizeUrl: cachedImage.cdnUrl || '/placeholder.png',
                        alt: cachedImage.alt || 'Image',
                        categoryId: this.categoryId,
                        isFromCache: true
                    };

                    console.log(`Added cached image ${id} to display while waiting for CDN`);
                    addedImages.push(imageToAdd);
                }

                // If we have cached images, start the CDN status check and show notification
                if (Object.keys(this.cachedLocalImages).length > 0) {
                    showToast.info(
                        `Showing ${Object.keys(this.cachedLocalImages).length} recently uploaded images while Sanity processes them.`
                    );
                    this.startCdnStatusCheck();
                }
            }
        } catch (error) {
            console.error('Error loading cached images from session storage:', error);
        }

        this.cacheInitialized = true;
        return addedImages;
    }

    // Clear image cache for a specific image once it's available from Sanity CDN
    clearCachedImage(imageId: string): void {
        if (!this.useCdn || !this.cachedLocalImages[imageId]) return;

        delete this.cachedLocalImages[imageId];
        try {
            sessionStorage.setItem(this.cacheKey, JSON.stringify(this.cachedLocalImages));
        } catch (error) {
            console.error('Error updating image cache in session storage:', error);
        }
    }

    // Check if the Sanity CDN versions are ready by testing image URLs
    startCdnStatusCheck(): void {
        if (!this.useCdn) return;

        // Clear any existing interval
        if (this.checkCdnStatusInterval) {
            clearInterval(this.checkCdnStatusInterval);
        }

        // Initial check immediately
        this.checkCdnAvailability();

        // Then check every 5 seconds for CDN readiness
        this.checkCdnStatusInterval = setInterval(() => this.checkCdnAvailability(), 5000);
    }

    // Function to check CDN availability for cached images
    private checkCdnAvailability(): void {
        if (!this.useCdn) return;

        const imageIds = Object.keys(this.cachedLocalImages);
        if (imageIds.length === 0) {
            // No cached images to check, clear the interval
            if (this.checkCdnStatusInterval) {
                clearInterval(this.checkCdnStatusInterval);
                this.checkCdnStatusInterval = null;
            }
            return;
        }

        console.log(`Checking CDN availability for ${imageIds.length} images...`);

        // Count to track how many images we're checking
        let pendingChecks = 0;

        // For each cached image, try to load it from Sanity CDN
        imageIds.forEach((id) => {
            const cachedImage = this.cachedLocalImages[id];

            // Skip if no URLs to check
            if (!cachedImage) return;

            // Log what we're working with for debugging
            console.log(`Image ${id} checking... 
            cdnUrl: ${cachedImage.cdnUrl || 'none'}
            fullSizeUrl: ${cachedImage.fullSizeUrl || 'none'}
            url: ${cachedImage.url || 'none'}`);

            // Build possible URLs to check (in Sanity's format)
            const possibleUrls: string[] = [];

            // Add CDN URL if it exists
            if (cachedImage.cdnUrl && !cachedImage.cdnUrl.startsWith('blob:')) {
                possibleUrls.push(cachedImage.cdnUrl);
            }

            // Add full size URL if it exists and isn't a blob
            if (cachedImage.fullSizeUrl && !cachedImage.fullSizeUrl.startsWith('blob:')) {
                possibleUrls.push(cachedImage.fullSizeUrl);
            }

            // Check if we have any valid URLs to test
            if (possibleUrls.length === 0) {
                console.log(`No valid URLs to check for image ${id}`);
                return;
            }

            // Increment pending checks
            pendingChecks++;

            // Try each URL until one works
            let urlIndex = 0;

            const tryNextUrl = () => {
                if (urlIndex >= possibleUrls.length) {
                    // All URLs failed, log and decrement counter
                    pendingChecks--;
                    console.log(`Image ${id} not yet available from Sanity CDN, will retry`);
                    return;
                }

                const urlToCheck = possibleUrls[urlIndex];

                // Properly format the cache-busting URL parameter
                const urlWithCacheBusting = urlToCheck.includes('?')
                    ? `${urlToCheck}&cb=${new Date().getTime()}`
                    : `${urlToCheck}?cb=${new Date().getTime()}`;

                // Use image preloading instead of fetch API for more reliable detection
                const img = new Image();
                img.onload = () => {
                    pendingChecks--;
                    console.log(`Image ${id} now available from Sanity CDN (URL: ${urlToCheck})`);

                    // Dispatch a custom event to notify parent components
                    this.dispatchImageReady(id, urlToCheck);

                    // Remove from cache
                    this.clearCachedImage(id);
                };

                img.onerror = () => {
                    // This URL failed, try the next one
                    urlIndex++;
                    tryNextUrl();
                };

                // Start loading the image
                img.src = urlWithCacheBusting;
            };

            // Start trying URLs
            tryNextUrl();
        });

        // If no more images to check, cleanup
        if (pendingChecks === 0 && Object.keys(this.cachedLocalImages).length === 0) {
            console.log('All images confirmed available from CDN, cleaning up');
            if (this.checkCdnStatusInterval) {
                clearInterval(this.checkCdnStatusInterval);
                this.checkCdnStatusInterval = null;
            }
        }
    }

    // Store newly uploaded images in cache
    storeUploadedImages(images: Image[]): void {
        if (!this.useCdn || images.length === 0) return;

        // Add the new images to our cache
        images.forEach((img) => {
            this.cachedLocalImages[img.id] = img;
        });

        // Store in session storage
        try {
            sessionStorage.setItem(this.cacheKey, JSON.stringify(this.cachedLocalImages));
        } catch (error) {
            console.error('Error storing images in session storage:', error);
        }
    }

    // Clean up stale cached images that have been in the cache too long
    cleanupStaleCache(): void {
        if (!this.useCdn) return;

        const now = Date.now();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        let cacheCleaned = false;

        for (const [id, cachedImage] of Object.entries(this.cachedLocalImages)) {
            // Clean up images older than 5 minutes
            const uploadTime = cachedImage.uploadedAt || 0;
            if (uploadTime > 0 && now - uploadTime > FIVE_MINUTES_MS) {
                console.log(
                    `Cleaning up stale cached image ${id} (uploaded ${Math.round((now - uploadTime) / 1000 / 60)} minutes ago)`
                );
                delete this.cachedLocalImages[id];
                cacheCleaned = true;
            }
        }

        // Update session storage if we cleaned anything
        if (cacheCleaned) {
            try {
                sessionStorage.setItem(this.cacheKey, JSON.stringify(this.cachedLocalImages));
            } catch (error) {
                console.error('Error updating image cache in session storage:', error);
            }
        }
    }

    // Get current cached images count
    getCachedImagesCount(): number {
        return Object.keys(this.cachedLocalImages).length;
    }

    // Cleanup resources
    destroy(): void {
        if (this.checkCdnStatusInterval) {
            clearInterval(this.checkCdnStatusInterval);
            this.checkCdnStatusInterval = null;
        }
    }

    // Method to dispatch events (to be overridden by consumers)
    private dispatchImageReady(imageId: string, cdnUrl: string): void {
        // This will be handled by the consumer via callbacks or events
        // For now, we'll use a custom event that can be listened to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('imageReadyFromCDN', {
                    detail: { imageId, cdnUrl }
                })
            );
        }
    }
}
