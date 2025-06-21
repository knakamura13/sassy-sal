<script lang="ts">
    import { onMount, tick, onDestroy } from 'svelte';

    import { adminMode } from '$lib/stores/adminStore';
    import { type Image, imageStore } from '$lib/stores/imageStore';
    import { showToast } from '$lib/utils';
    import { cloneImages, ensureImageOrder, sortImagesByOrder } from '$lib/utils/imageUtils';
    import { CDNCacheManager } from '$lib/services/cdnCacheManager';
    import { ImageOperationsService } from '$lib/services/imageOperations';
    import AdminControls from './AdminControls.svelte';
    import CategoryNavigation from './CategoryNavigation.svelte';
    import ImageCard from './ImageCard.svelte';
    import ImagePreview from './ImagePreview.svelte';
    import UploadPlaceholder from './UploadPlaceholder.svelte';
    import UploadProgressDialog from './UploadProgressDialog.svelte';

    // Check if CDN is enabled via environment variable
    const useCdn = Boolean(import.meta.env.VITE_USE_CDN) || false;

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
    let hasFailedUploads = false;

    // Service instances
    let cacheManager: CDNCacheManager;
    let imageOperationsService: ImageOperationsService;

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
    let uploadSpeed = 0;
    let isCanceled = false;

    // Initialize services and load cached images
    onMount(() => {
        // Initialize services
        cacheManager = new CDNCacheManager(categoryId, useCdn);
        imageOperationsService = new ImageOperationsService();

        // Load any cached images (only if CDN is enabled)
        if (useCdn) {
            const cachedImages = cacheManager.loadCachedImages();
            if (cachedImages.length > 0) {
                images = [...images, ...cachedImages];
                cacheManager.cleanupStaleCache();
            }
        }

        // Initialize with order values and create deep copies
        const processedImages = ensureImageOrder(images);
        originalImages = cloneImages(processedImages);
        localImages = cloneImages(processedImages);

        // Fetch next category if we have a valid category ID and order
        if (categoryId && categoryOrder !== undefined) {
            fetchNextCategory();
        }

        // Listen for CDN image ready events
        if (useCdn) {
            window.addEventListener('imageReadyFromCDN', handleImageReadyFromCDN as EventListener);
        }

        return () => {
            // Clean up services
            cacheManager?.destroy();

            // Remove event listeners
            if (useCdn) {
                window.removeEventListener('imageReadyFromCDN', handleImageReadyFromCDN as EventListener);
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
        // Clean up services when component is destroyed
        cacheManager?.destroy();
    });

    // Handle CDN image ready event
    function handleImageReadyFromCDN(event: CustomEvent) {
        const { imageId, cdnUrl } = event.detail;

        // Find this image in localImages and update its URLs with CDN versions
        const imageIndex = localImages.findIndex((img) => img.id === imageId);
        if (imageIndex !== -1) {
            // Create new image object with CDN URL
            const updatedImage = {
                ...localImages[imageIndex],
                url: cdnUrl,
                thumbnailUrl: cdnUrl,
                fullSizeUrl: cdnUrl,
                isFromCache: false
            };

            // Update the array with the new image
            localImages[imageIndex] = updatedImage;

            // Force reactive update
            localImages = [...localImages];

            // Force image re-rendering in children
            tick().then(() => {
                console.log(`UI updated for image ${imageId}`);
            });
        }
    }

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
        if (isSaving || !imageOperationsService) return;

        isSaving = true;

        const result = await imageOperationsService.saveChanges({
            localImages,
            originalImages,
            categoryId,
            useCdn,
            cacheManager,
            progressCallbacks: {
                onProgress: (step, total, percentage, message, operation) => {
                    uploadStep = step;
                    uploadTotal = total;
                    uploadPercentage = percentage;
                    uploadMessage = message;
                    uploadOperation = operation;
                    showProgressDialog = total > 0;
                },
                onFileProgress: (uploadedBytes, totalBytes, speed) => {
                    uploadedFileSizeBytes = uploadedBytes;
                    totalFileSizeBytes = totalBytes;
                    uploadSpeed = speed;
                },
                onComplete: async (success, newImages) => {
                    // Keep the dialog visible for a moment so user can see completion
                    if (success && !isCanceled) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    showProgressDialog = false;

                    if (success && !isCanceled) {
                        isModified = false;
                        hasFailedUploads = false;
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

                        // If we have cached images, show message
                        if (useCdn && newImages.length > 0) {
                            showToast.info(
                                'Images uploaded. You will see them immediately after refresh while Sanity processes them.'
                            );
                        }

                        // Wait a bit longer to ensure server has time to process the final requests
                        refreshAfterDelay(1500);
                    } else if (result.failedUploads && result.failedUploads.length > 0) {
                        // Handle partial success - some uploads failed
                        hasFailedUploads = true;
                        const networkErrors = result.failedUploads.filter(
                            (failure) =>
                                failure.error.includes('Failed to fetch') ||
                                failure.error.includes('NetworkError') ||
                                failure.error.includes('ERR_NETWORK_CHANGED')
                        );

                        if (networkErrors.length > 0) {
                            showToast.error(
                                `${networkErrors.length} image(s) failed to upload due to network issues. Please check your connection and try again.`
                            );
                        } else {
                            showToast.error(
                                `${result.failedUploads.length} image(s) failed to upload. Please try again.`
                            );
                        }

                        // Log detailed error information for debugging
                        console.error('Failed uploads:', result.failedUploads);
                    }
                },
                onCancel: () => {
                    uploadMessage = 'Canceling upload process...';
                    showProgressDialog = false;
                    showToast.info('Upload process was canceled');
                    refreshAfterDelay(1000);
                }
            }
        });

        isSaving = false;
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

    // Function to handle cancel upload
    function cancelUpload() {
        isCanceled = true;
        imageOperationsService?.cancelUpload();
    }

    // Function to retry failed uploads
    async function retryFailedUploads() {
        if (!imageOperationsService || isSaving) return;

        showToast.info('Retrying failed uploads...');
        await saveChanges();
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
        }
    }}
/>

<div class="gallery-container m-auto max-w-[1400px] py-6 pb-24">
    <div class="grid w-full grid-cols-1 gap-6">
        {#if $adminMode && isModified}
            <AdminControls
                {isSaving}
                {hasFailedUploads}
                on:save={saveChanges}
                on:discard={discardChanges}
                on:retry={retryFailedUploads}
            />
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
            <AdminControls
                {isSaving}
                {hasFailedUploads}
                on:save={saveChanges}
                on:discard={discardChanges}
                on:retry={retryFailedUploads}
            />
        {/if}
    </div>

    <CategoryNavigation {nextCategory} />

    <ImagePreview image={previewImage} show={showPreview} on:close={handlePreviewClose} />
</div>

<UploadProgressDialog
    bind:show={showProgressDialog}
    {uploadOperation}
    {uploadMessage}
    {uploadStep}
    {uploadTotal}
    {uploadPercentage}
    {totalFileSizeBytes}
    {uploadedFileSizeBytes}
    {uploadSpeed}
    {isCanceled}
    on:cancel={cancelUpload}
/>

<style lang="scss">
</style>
