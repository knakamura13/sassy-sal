<script lang="ts">
    import { onMount, tick, onDestroy } from 'svelte';

    import { adminMode } from '$lib/stores/adminStore';
    import { type Image, imageStore } from '$lib/stores/imageStore';
    import { showToast } from '$lib/utils';
    import { cloneImages, ensureImageOrder, findImageChanges, sortImagesByOrder } from '$lib/utils/imageUtils';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Alert from '$lib/components/ui/alert';
    import * as Progress from '$lib/components/ui/progress';
    import AdminControls from './AdminControls.svelte';
    import CategoryNavigation from './CategoryNavigation.svelte';
    import ImageCard from './ImageCard.svelte';
    import ImagePreview from './ImagePreview.svelte';
    import UploadPlaceholder from './UploadPlaceholder.svelte';

    // Props for category support
    export let images: Image[] = [];
    export let categoryId: string = '';
    export let categoryOrder: number | undefined = undefined;

    // Local copy of images for editing in admin mode
    let localImages: Image[] = [];
    let originalImages: Image[] = [];
    let sortedImages: Image[] = [];
    let isModified = false;
    let isSaving = false;
    let isReorderingImages = false;

    // Used for optimistic UI to show images before Sanity CDN is ready
    let cachedLocalImages: Record<string, Image> = {};
    const IMAGE_CACHE_KEY = `sanity-image-cache-${categoryId}`;
    let cacheInitialized = false;
    let checkCdnStatusInterval: ReturnType<typeof setInterval>;

    // Next category navigation state
    let nextCategory: { id: string; name: string } | null = null;
    let isLoadingNextCategory = false;

    // Image preview state
    let previewImage: Image | null = null;
    let showPreview = false;

    // Upload progress state
    let showProgressDialog = false;
    let uploadStep = 0;
    let uploadTotal = 0;
    let uploadMessage = '';
    let uploadPercentage = 0;
    let uploadOperation = '';
    let totalFileSizeBytes = 0;
    let uploadedFileSizeBytes = 0;
    let uploadStartTime = 0;
    let uploadSpeed = 0; // Bytes per second
    let isCanceled = false; // Add flag to track cancellation state

    // Function to load cached images from session storage
    function loadCachedImages() {
        if (cacheInitialized) return;

        try {
            const cacheData = sessionStorage.getItem(IMAGE_CACHE_KEY);
            if (cacheData) {
                cachedLocalImages = JSON.parse(cacheData);

                // Apply cached images to the current set if they aren't in the loaded images
                const imageIds = new Set(images.map((img) => img.id));

                for (const [id, cachedImage] of Object.entries(cachedLocalImages)) {
                    if (!imageIds.has(id)) {
                        // Create a proper image object
                        const imageToAdd: Image = {
                            ...(cachedImage as Image),
                            id: id,
                            // Use the CDN URL directly if available, otherwise use a placeholder
                            url: cachedImage.cdnUrl || '/placeholder.png',
                            thumbnailUrl: cachedImage.cdnUrl || '/placeholder.png',
                            fullSizeUrl: cachedImage.cdnUrl || '/placeholder.png',
                            alt: cachedImage.alt || 'Image',
                            categoryId: categoryId,
                            isFromCache: true
                        };

                        console.log(`Added cached image ${id} to display while waiting for CDN`);
                        // Add to the images array
                        images = [...images, imageToAdd];
                        // Also add to local images
                        localImages = [...localImages, imageToAdd];
                    }
                }

                // If we have cached images, start the CDN status check and show notification
                if (Object.keys(cachedLocalImages).length > 0) {
                    showToast.info(
                        `Showing ${Object.keys(cachedLocalImages).length} recently uploaded images while Sanity processes them.`
                    );
                    startCdnStatusCheck();
                }
            }
        } catch (error) {
            console.error('Error loading cached images from session storage:', error);
        }

        cacheInitialized = true;
    }

    // Clear image cache for a specific image once it's available from Sanity CDN
    function clearCachedImage(imageId: string) {
        if (cachedLocalImages[imageId]) {
            delete cachedLocalImages[imageId];
            try {
                sessionStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cachedLocalImages));
            } catch (error) {
                console.error('Error updating image cache in session storage:', error);
            }
        }
    }

    // Check if the Sanity CDN versions are ready by testing image URLs
    function startCdnStatusCheck() {
        // Clear any existing interval
        if (checkCdnStatusInterval) {
            clearInterval(checkCdnStatusInterval);
        }

        // Initial check immediately
        checkCdnAvailability();

        // Then check every 5 seconds for CDN readiness
        checkCdnStatusInterval = setInterval(checkCdnAvailability, 5000);
    }

    // Function to check CDN availability for cached images
    function checkCdnAvailability() {
        const imageIds = Object.keys(cachedLocalImages);
        if (imageIds.length === 0) {
            // No cached images to check, clear the interval
            if (checkCdnStatusInterval) {
                clearInterval(checkCdnStatusInterval);
            }
            return;
        }

        console.log(`Checking CDN availability for ${imageIds.length} images...`);

        // Count to track how many images we're checking
        let pendingChecks = 0;

        // For each cached image, try to load it from Sanity CDN
        imageIds.forEach((id) => {
            const cachedImage = cachedLocalImages[id];

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

            function tryNextUrl() {
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

                    // Find this image in localImages and update its URLs with CDN versions
                    const imageIndex = localImages.findIndex((img) => img.id === id);
                    if (imageIndex !== -1) {
                        // Create new image object with CDN URL
                        const updatedImage = {
                            ...localImages[imageIndex],
                            url: urlToCheck,
                            thumbnailUrl: urlToCheck,
                            fullSizeUrl: urlToCheck,
                            isFromCache: false
                        };

                        // Update the array with the new image
                        localImages[imageIndex] = updatedImage;

                        // Force reactive update
                        localImages = [...localImages];

                        // Force image re-rendering in children
                        tick().then(() => {
                            console.log(`UI updated for image ${id}`);
                        });
                    }

                    // Remove from cache
                    clearCachedImage(id);
                };

                img.onerror = () => {
                    // This URL failed, try the next one
                    urlIndex++;
                    tryNextUrl();
                };

                // Start loading the image
                img.src = urlWithCacheBusting;
            }

            // Start trying URLs
            tryNextUrl();
        });

        // If no more images to check, cleanup
        if (pendingChecks === 0 && Object.keys(cachedLocalImages).length === 0) {
            console.log('All images confirmed available from CDN, cleaning up');
            if (checkCdnStatusInterval) {
                clearInterval(checkCdnStatusInterval);
            }
        }
    }

    // Initialize with provided category images
    onMount(() => {
        // Load any cached images
        loadCachedImages();

        // Start checking for CDN status if we have cached images
        if (Object.keys(cachedLocalImages).length > 0) {
            // Immediately check if images are already available
            checkCdnAvailability();

            // Then keep checking every 5 seconds
            checkCdnStatusInterval = setInterval(checkCdnAvailability, 5000);

            // Add a forced cleanup of very old cached images (more than 5 minutes old)
            cleanupStaleCache();
        }

        // Initialize with order values and create deep copies
        const processedImages = ensureImageOrder(images);
        originalImages = cloneImages(processedImages);
        localImages = cloneImages(processedImages);

        // Fetch next category if we have a valid category ID and order
        if (categoryId && categoryOrder !== undefined) {
            fetchNextCategory();
        }

        // Set up an interval to update upload statistics regularly
        const updateInterval = setInterval(() => {
            if (showProgressDialog && uploadStartTime > 0) {
                updateUploadSpeed();
            }
        }, 1000);

        // Clean up the interval when component is unmounted
        return () => {
            clearInterval(updateInterval);
            if (checkCdnStatusInterval) {
                clearInterval(checkCdnStatusInterval);
            }

            // Clean up any blob URLs when component unmounts
            localImages.forEach((img) => {
                if (img.url && img.url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.url);
                }
                if (img.thumbnailUrl && img.thumbnailUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(img.thumbnailUrl);
                }
                if (img.fullSizeUrl && img.fullSizeUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(img.fullSizeUrl);
                }
            });
        };
    });

    onDestroy(() => {
        // Clean up the CDN check interval when component is destroyed
        if (checkCdnStatusInterval) {
            clearInterval(checkCdnStatusInterval);
        }
    });

    // Fetch the next category based on current category order
    async function fetchNextCategory() {
        if (!categoryId || categoryOrder === undefined || isLoadingNextCategory) return;

        isLoadingNextCategory = true;
        try {
            // Import Sanity helper to get all categories
            const { getAllCategories } = await import('$lib/services/sanityHelpers');
            const categories = await getAllCategories();

            if (categories.length <= 1) {
                return;
            }

            // Sort categories by order to ensure correct sequence
            const sortedCategories = [...categories].sort(
                (a, b) => (a.attributes.order || 0) - (b.attributes.order || 0)
            );

            // Find the category with the next highest order
            const nextCat = sortedCategories.find(
                (cat) => (cat.attributes.order || 0) > (categoryOrder || 0) && cat.id !== categoryId
            );

            // If we've found a next category, use it
            if (nextCat) {
                nextCategory = {
                    id: nextCat.id,
                    name: nextCat.attributes.name
                };
            } else {
                // If there's no next category (we're at the last one),
                // get the first category (lowest order)
                const firstCategory = sortedCategories[0];
                if (firstCategory && firstCategory.id !== categoryId) {
                    nextCategory = {
                        id: firstCategory.id,
                        name: firstCategory.attributes.name
                    };
                }
            }
        } catch (error) {
            console.error('Error fetching next category:', error);
        } finally {
            isLoadingNextCategory = false;
        }
    }

    $: {
        // Update local images when category images change
        // But only if we're not in a modified state to avoid losing edits
        if (!isModified) {
            originalImages = cloneImages(images);
            localImages = cloneImages(images);
        }
    }

    // Use the utility function to sort images
    $: sortedImages = sortImagesByOrder(localImages);

    function refreshAfterDelay(delay: number) {
        setTimeout(() => {
            // Simply reload the current page without adding timestamp parameter
            window.location.reload();
        }, delay);
    }

    // Function to handle saving changes
    async function saveChanges() {
        if (isSaving) return; // Prevent multiple save operations
        isSaving = true;
        isCanceled = false; // Reset canceled state

        let allProcessingComplete = false; // Flag to track completion of all operations
        const newlyUploadedImages: Image[] = []; // Store newly uploaded images for caching

        // Find images to add, update, or remove
        const { imagesToAdd, imagesToRemove, imagesToUpdate } = findImageChanges(localImages, originalImages);

        // Reset file size tracking
        totalFileSizeBytes = 0;
        uploadedFileSizeBytes = 0;
        uploadSpeed = 0;

        // Calculate total file size to upload
        const filesToUpload = [...imagesToAdd.filter((img) => img.file), ...imagesToUpdate.filter((img) => img.file)];

        for (const image of filesToUpload) {
            if (image.file) {
                totalFileSizeBytes += image.file.size;
            }
        }

        // Calculate total operations for progress tracking
        uploadTotal = imagesToRemove.length + imagesToAdd.length + imagesToUpdate.length;
        uploadStep = 0;

        // Only show progress dialog if there are operations to perform
        if (uploadTotal > 0) {
            uploadMessage = 'Preparing to process images...';
            uploadPercentage = 0;
            showProgressDialog = true;
            uploadStartTime = Date.now();
        }

        // Process changes
        try {
            // Import Sanity services
            const { addImage, deleteImage, updateImage } = await import('$lib/services/sanityContentService');

            // Process deletions first
            if (imagesToRemove.length > 0) {
                uploadOperation = 'Deleting';
                uploadMessage = `Deleting images...`;

                for (const image of imagesToRemove) {
                    if (isCanceled) break; // Check for cancellation
                    try {
                        await deleteImage(image.id);

                        // Remove from cache if present
                        clearCachedImage(image.id);

                        uploadStep++;
                        uploadPercentage = Math.round((uploadStep / uploadTotal) * 100);
                        uploadMessage = `Deleting image ${uploadStep} of ${imagesToRemove.length}...`;
                    } catch (error) {
                        console.error('Error deleting image:', error);
                        // Continue with other deletions even if one fails
                    }
                }
            }

            // Process additions
            if (imagesToAdd.length > 0 && !isCanceled) {
                uploadOperation = 'Uploading';
                uploadMessage = `Uploading new images...`;

                for (let i = 0; i < imagesToAdd.length; i++) {
                    if (isCanceled) break; // Check for cancellation
                    const image = imagesToAdd[i];
                    if (!image.file) {
                        uploadStep++;
                        continue;
                    }

                    try {
                        // Prepare image data for API
                        const imageData = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0),
                            image: image.file,
                            category: categoryId
                        };

                        const fileSize = image.file.size;
                        const fileSizeFormatted = formatFileSize(fileSize);
                        uploadMessage = `Uploading image ${i + 1} of ${imagesToAdd.length} (${fileSizeFormatted})...`;

                        // Add the image in Sanity
                        const uploadResult = await addImage(imageData);

                        // Create a copy of this image that we can cache
                        if (uploadResult?.data?.id) {
                            const uploadedImage = {
                                ...image,
                                id: uploadResult.data.id,
                                // Keep local URLs for immediate display until CDN is ready
                                url: image.url,
                                thumbnailUrl: image.thumbnailUrl || image.url,
                                fullSizeUrl: image.fullSizeUrl || image.url,
                                // Store the CDN URLs for checking availability
                                cdnUrl: uploadResult.data.attributes?.image?.data?.attributes?.url,
                                // Store additional metadata
                                uploadedAt: new Date().getTime(),
                                categoryId
                            };

                            // Add to the list of uploaded images for session storage
                            newlyUploadedImages.push(uploadedImage);
                        }

                        // Update upload statistics
                        uploadedFileSizeBytes += fileSize;
                        updateUploadSpeed();

                        uploadStep++;
                        uploadPercentage = Math.round((uploadStep / uploadTotal) * 100);
                    } catch (err) {
                        console.error('Error adding image:', err);
                        uploadStep++;
                        // Continue with other uploads even if one fails
                    }
                }
            }

            // Process updates
            if (imagesToUpdate.length > 0 && !isCanceled) {
                uploadOperation = 'Updating';
                uploadMessage = `Updating images...`;

                for (let i = 0; i < imagesToUpdate.length; i++) {
                    if (isCanceled) break; // Check for cancellation
                    const image = imagesToUpdate[i];
                    try {
                        // Prepare update data
                        const updateData: any = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0)
                        };

                        // Include file if present
                        if (image.file) {
                            updateData.image = image.file;
                            const fileSize = image.file.size;
                            const fileSizeFormatted = formatFileSize(fileSize);
                            uploadMessage = `Updating image ${i + 1} of ${imagesToUpdate.length} with new file (${fileSizeFormatted})...`;

                            // Store the update in cache
                            const updatedImage = {
                                ...image,
                                // Keep local URLs for immediate display until CDN is ready
                                url: URL.createObjectURL(image.file),
                                thumbnailUrl: URL.createObjectURL(image.file),
                                fullSizeUrl: URL.createObjectURL(image.file),
                                // Store additional metadata
                                updatedAt: new Date().getTime(),
                                categoryId
                            };

                            // Add to cache
                            newlyUploadedImages.push(updatedImage);
                        } else {
                            uploadMessage = `Updating image ${i + 1} of ${imagesToUpdate.length}...`;
                        }

                        // Update the image
                        await updateImage(image.id, updateData);

                        // Update upload statistics if we uploaded a file
                        if (image.file) {
                            uploadedFileSizeBytes += image.file.size;
                            updateUploadSpeed();
                        }

                        uploadStep++;
                        uploadPercentage = Math.round((uploadStep / uploadTotal) * 100);
                    } catch (error) {
                        console.error('Error updating image:', error);
                        uploadStep++;
                        // Continue with other updates even if one fails
                    }
                }
            }

            // Store newly uploaded images in cache
            if (newlyUploadedImages.length > 0) {
                // Add the new images to our cache
                newlyUploadedImages.forEach((img) => {
                    cachedLocalImages[img.id] = img;
                });

                // Store in session storage
                try {
                    sessionStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cachedLocalImages));
                } catch (error) {
                    console.error('Error storing images in session storage:', error);
                }
            }

            // Mark all processing as complete
            allProcessingComplete = true;

            // Set final progress state before hiding dialog
            if (isCanceled) {
                uploadMessage = 'Upload process canceled.';
            } else {
                uploadMessage = 'All images processed successfully!';
                uploadPercentage = 100;
            }

            // Keep the dialog visible for a moment so user can see completion
            if (!isCanceled) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            showProgressDialog = false;

            if (!isCanceled) {
                isModified = false;
                showToast.success('Changes saved successfully');

                // Revoke any blob URLs before refreshing
                localImages.forEach((img) => {
                    if (img.url && img.url.startsWith('blob:')) {
                        URL.revokeObjectURL(img.url);
                    }
                    if (img.thumbnailUrl && img.thumbnailUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(img.thumbnailUrl);
                    }
                    if (img.fullSizeUrl && img.fullSizeUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(img.fullSizeUrl);
                    }
                });

                // Only refresh if all operations completed successfully
                if (allProcessingComplete) {
                    // If we have cached images, start CDN status check after refresh
                    if (newlyUploadedImages.length > 0) {
                        showToast.info(
                            'Images uploaded. You will see them immediately after refresh while Sanity processes them.'
                        );
                    }

                    // Wait a bit longer to ensure server has time to process the final requests
                    refreshAfterDelay(1500);
                } else {
                    showToast.error(
                        'Some uploads may not have completed successfully. Please check and try again if needed.'
                    );
                }
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            showToast.error('Error saving changes. Please try again.');
            showProgressDialog = false;
        } finally {
            isSaving = false;
        }
    }

    // Function to handle image order change
    function updateImageOrder(imageId: string, newOrder: number) {
        if (!$adminMode || isReorderingImages) return;

        isReorderingImages = true;
        try {
            // Find the image to update
            const imageIndex = localImages.findIndex((img) => img.id === imageId);
            if (imageIndex === -1) {
                console.error('Image not found:', imageId);
                return;
            }

            // Update the order of the specific image
            localImages[imageIndex] = {
                ...localImages[imageIndex],
                order: newOrder
            };

            // Mark as modified
            isModified = true;
        } finally {
            isReorderingImages = false;
        }
    }

    // Function to move image up in order (decrease order number)
    function moveImageUp(imageId: string) {
        const imageIndex = sortedImages.findIndex((img) => img.id === imageId);
        if (imageIndex <= 0) return; // Already at the top

        const currentImage = sortedImages[imageIndex];
        const prevImage = sortedImages[imageIndex - 1];

        // Swap orders
        updateImageOrder(currentImage.id, prevImage.order || 0);
        updateImageOrder(prevImage.id, currentImage.order || 0);
    }

    // Function to move image down in order (increase order number)
    function moveImageDown(imageId: string) {
        const imageIndex = sortedImages.findIndex((img) => img.id === imageId);
        if (imageIndex === -1 || imageIndex >= sortedImages.length - 1) return; // Already at the bottom

        const currentImage = sortedImages[imageIndex];
        const nextImage = sortedImages[imageIndex + 1];

        // Swap orders
        updateImageOrder(currentImage.id, nextImage.order || 0);
        updateImageOrder(nextImage.id, currentImage.order || 0);
    }

    // Function to discard changes
    function discardChanges() {
        // Revoke any blob URLs to prevent memory leaks
        localImages.forEach((img) => {
            // Check if URL is a blob URL that we created
            if (img.url && img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url);
            }
            if (img.thumbnailUrl && img.thumbnailUrl.startsWith('blob:')) {
                URL.revokeObjectURL(img.thumbnailUrl);
            }
            if (img.fullSizeUrl && img.fullSizeUrl.startsWith('blob:')) {
                URL.revokeObjectURL(img.fullSizeUrl);
            }
        });

        imageStore.reset();
        localImages = cloneImages(originalImages);
        isModified = false;
        showToast.info('Changes discarded');
    }

    // Function to handle image removal with optimistic UI and immediate deletion
    async function handleRemoveImage(id: string) {
        // Remove image optimistically from local images
        localImages = localImages.filter((img) => img.id !== id);

        // Mark gallery as modified to trigger save button
        isModified = true;

        // Show toast notification
        showToast.info('Image removed. Click "Save Changes" to delete permanently.');
    }

    // Function to handle image update
    function handleUpdateImage(event: CustomEvent) {
        const { id, data } = event.detail;

        // Find the image to update
        const imageIndex = localImages.findIndex((img) => img.id === id);
        if (imageIndex === -1) return;

        // Extract the actual update fields from the nested structure
        const updateFields = data.data || {};

        // Convert order to number and ensure it's properly updated
        const newOrder =
            updateFields.order !== undefined
                ? Number(updateFields.order)
                : localImages[imageIndex].order !== undefined
                  ? Number(localImages[imageIndex].order)
                  : 0;

        // Handle image file update if present
        let imageFile = null;
        if (updateFields.image && updateFields.image instanceof File) {
            imageFile = updateFields.image;
        }

        // Update the image in the array
        localImages[imageIndex] = {
            ...localImages[imageIndex],
            order: newOrder,
            file: imageFile // Store file for later processing
        };

        // Force reactive update by reassigning the array
        localImages = [...localImages];

        // Mark gallery as modified
        isModified = true;
    }

    // Function to handle new image addition
    function handleAddImages(newImages: Image[]) {
        // Set the category ID for new images
        if (categoryId) {
            newImages = newImages.map((img) => ({
                ...img,
                categoryId
            }));
        }

        // Process images to ensure blob URLs stay valid
        const processedImages = newImages.map((img) => {
            if (img.file) {
                // Create a new blob URL that will persist
                const newBlobUrl = URL.createObjectURL(img.file);
                return {
                    ...img,
                    url: newBlobUrl,
                    thumbnailUrl: newBlobUrl,
                    fullSizeUrl: newBlobUrl,
                    isFromCache: true // Mark as coming from cache for styling
                };
            }
            return img;
        });

        localImages = [...localImages, ...processedImages];
        isModified = true;

        // Scroll to .next-category-nav at the bottom of the page
        setTimeout(() => {
            const nextCategoryNav = document.querySelector('.next-category-nav');
            if (nextCategoryNav) {
                nextCategoryNav.scrollIntoView({ behavior: 'smooth' });
            }
        }, 150);

        // Show a toast notification
        showToast.success(
            `${processedImages.length} images added. Remember to press "Save Changes" to upload and publish the new images.`
        );
    }

    // Function to handle image click for preview
    function handleImageClick(image: Image) {
        if (!showPreview) {
            previewImage = image;
            showPreview = true;
        }
    }

    // Function to handle preview close
    function handlePreviewClose() {
        showPreview = false;
        previewImage = null;
    }

    // Helper function to format file size
    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Helper function to format upload speed
    function formatSpeed(bytesPerSecond: number): string {
        if (bytesPerSecond === 0) return '0 KB/s';

        if (bytesPerSecond < 1024) {
            return bytesPerSecond.toFixed(1) + ' B/s';
        } else if (bytesPerSecond < 1048576) {
            return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
        }

        return (bytesPerSecond / 1048576).toFixed(1) + ' MB/s';
    }

    // Simple moving average of the last 10 upload speeds
    let uploadSpeeds: number[] = [];
    $: SMA = uploadSpeeds.length
        ? uploadSpeeds.slice(-10).reduce((sum, speed) => sum + speed, 0) / uploadSpeeds.slice(-10).length
        : 0;

    function updateUploadSpeed() {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - uploadStartTime) / 1000;

        if (elapsedSeconds > 0) {
            uploadSpeed = uploadedFileSizeBytes / elapsedSeconds;
            uploadSpeeds = [...uploadSpeeds, uploadSpeed];
        }
    }

    // Helper function to format remaining time
    function formatTimeRemaining(seconds: number): string {
        if (!isFinite(seconds) || seconds <= 0) {
            return 'Almost done...';
        }

        if (seconds < 60) {
            return `${Math.ceil(seconds)} seconds`;
        } else if (seconds < 3600) {
            return `${Math.ceil(seconds / 60)} minutes`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.ceil((seconds % 3600) / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    // Function to handle cancel upload
    function cancelUpload() {
        isCanceled = true;
        uploadMessage = 'Canceling upload process...';
        showProgressDialog = false; // Close dialog immediately
        showToast.info('Upload process was canceled');

        refreshAfterDelay(1000);
    }

    // Function to clean up stale cached images that have been in the cache too long
    function cleanupStaleCache() {
        const now = Date.now();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        let cacheCleaned = false;

        for (const [id, cachedImage] of Object.entries(cachedLocalImages)) {
            // Clean up images older than 5 minutes
            const uploadTime = cachedImage.uploadedAt || 0;
            if (uploadTime > 0 && now - uploadTime > FIVE_MINUTES_MS) {
                console.log(
                    `Cleaning up stale cached image ${id} (uploaded ${Math.round((now - uploadTime) / 1000 / 60)} minutes ago)`
                );
                delete cachedLocalImages[id];
                cacheCleaned = true;
            }
        }

        // Update session storage if we cleaned anything
        if (cacheCleaned) {
            try {
                sessionStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cachedLocalImages));
            } catch (error) {
                console.error('Error updating image cache in session storage:', error);
            }
        }
    }
</script>

<svelte:window
    on:keydown={(e) => {
        if (showPreview && (e.key === 'Escape' || e.key === 'Enter')) {
            e.preventDefault();
            e.stopPropagation();
            handlePreviewClose();
        }
    }}
    on:beforeunload={(e) => {
        if ($adminMode && isModified) {
            // Show confirmation dialog before unloading page with unsaved changes
            e.preventDefault();
            // This message may not be displayed in modern browsers, but returning a string
            // will trigger the confirmation dialog
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }}
/>

<div class="gallery-container m-auto max-w-[1400px] py-6 pb-24">
    <div class="grid w-full grid-cols-1 gap-6">
        {#if $adminMode && isModified}
            <AdminControls {isSaving} on:save={saveChanges} on:discard={discardChanges} />
        {/if}

        {#each sortedImages as image (image.id)}
            <div
                class="gallery-item w-full"
                on:click|preventDefault|stopPropagation={() => handleImageClick(image)}
                on:keydown={(e) => e.key === 'Enter' && handleImageClick(image)}
                role="button"
                tabindex="0"
                aria-label={image.title || 'View image'}
            >
                <ImageCard
                    {image}
                    isCategory={true}
                    isAdmin={$adminMode}
                    on:remove={() => handleRemoveImage(image.id)}
                    on:update={handleUpdateImage}
                />
            </div>
        {/each}

        {#if $adminMode}
            <UploadPlaceholder on:addImages={(e) => handleAddImages(e.detail)} {categoryId} />
        {/if}

        <!-- Show Admin Controls at the bottom of the Gallery as well -->
        {#if $adminMode && isModified}
            <AdminControls {isSaving} on:save={saveChanges} on:discard={discardChanges} />
        {/if}
    </div>

    <CategoryNavigation {nextCategory} />

    <ImagePreview image={previewImage} show={showPreview} on:close={handlePreviewClose} />
</div>

<!-- Upload Progress Dialog -->
<AlertDialog.Root bind:open={showProgressDialog}>
    <AlertDialog.Content class="sm:max-w-md">
        <AlertDialog.Header>
            <AlertDialog.Title>{uploadOperation} Images</AlertDialog.Title>
            <AlertDialog.Description>
                <div class="space-y-4">
                    <Alert.Alert>
                        <Alert.AlertDescription>
                            {uploadMessage}
                        </Alert.AlertDescription>
                    </Alert.Alert>

                    <div class="flex flex-col space-y-1.5">
                        <div class="flex justify-between text-sm font-medium">
                            <span>Progress</span>
                            <span>{uploadStep} of {uploadTotal} items</span>
                        </div>
                        <Progress.Progress value={uploadPercentage} class="h-2" />
                        <div class="mt-1 flex justify-between text-sm text-muted-foreground">
                            <span>{uploadPercentage}%</span>
                            {#if totalFileSizeBytes > 0}
                                <span
                                    >{formatFileSize(uploadedFileSizeBytes)} of {formatFileSize(
                                        totalFileSizeBytes
                                    )}</span
                                >
                            {/if}
                        </div>
                    </div>

                    {#if uploadSpeed > 0}
                        <div class="mt-2 text-center text-sm text-muted-foreground">
                            <div class="flex items-center justify-center gap-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg
                                >
                                Upload speed: {formatSpeed(SMA)}
                            </div>
                            <div class="mt-1 text-xs">
                                Estimated time remaining: {uploadSpeed > 0
                                    ? formatTimeRemaining((totalFileSizeBytes - uploadedFileSizeBytes) / SMA)
                                    : 'Calculating...'}
                            </div>
                        </div>
                    {/if}
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel on:click={cancelUpload} disabled={isCanceled || uploadPercentage === 100}>
                Cancel
            </AlertDialog.Cancel>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<style lang="scss">
</style>
