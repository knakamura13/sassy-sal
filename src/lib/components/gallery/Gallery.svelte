<script lang="ts">
    import { imageStore, type Image } from '$lib/stores/imageStore';
    import { adminMode } from '$lib/stores/adminStore';
    import ImageCard from './ImageCard.svelte';
    import UploadPlaceholder from './UploadPlaceholder.svelte';
    import { onMount, tick } from 'svelte';
    import { showToast } from '$lib/utils';
    import { Button } from '$lib/components/ui/button';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';

    // New props for category support
    export let images: Image[] = [];
    export let categoryId: string = '';

    // Local copy of images for editing in admin mode
    let localImages: Image[] = [];
    let originalImages: Image[] = []; // Store original state for comparison
    let sortedImages: Image[] = [];
    let isModified = false;
    let isSaving = false; // New state for save operation
    let isReorderingImages = false; // State for tracking image reordering

    // Alert dialog state
    let showDiscardDialog = false;

    // Image preview state
    let previewImage: Image | null = null;
    let showPreview = false;

    // Modal container reference
    let modalContainer: HTMLElement;

    // Initialize with provided category images
    onMount(() => {
        // Create deep copies to avoid reference issues
        originalImages = images.map((img) => ({ ...img }));
        localImages = images.map((img) => ({ ...img }));
    });

    $: {
        // Update local images when category images change
        // But only if we're not in a modified state to avoid losing edits
        if (!isModified) {
            originalImages = images.map((img) => ({ ...img }));
            localImages = images.map((img) => ({ ...img }));
        }
    }

    // Sort images by order and then by title as a fallback
    $: sortedImages = [...localImages].sort((a, b) => {
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

    // Function to handle saving changes
    function saveChanges() {
        if (isSaving) return; // Prevent multiple save operations
        isSaving = true;

        // Find images to add, update, or remove
        const imagesToAdd = localImages.filter((local) => !originalImages.some((orig) => orig.id === local.id));
        const imagesToRemove = originalImages.filter((orig) => !localImages.some((local) => local.id === orig.id));

        // Find images with changed order
        const imagesToUpdate = localImages.filter((local) => {
            const orig = originalImages.find((o) => o.id === local.id);
            if (!orig) return false;

            // Convert both to numbers for proper comparison
            const localOrder = typeof local.order === 'number' ? local.order : Number(local.order || 0);
            const origOrder = typeof orig.order === 'number' ? orig.order : Number(orig.order || 0);

            return localOrder !== origOrder;
        });

        // Process changes
        const processChanges = async () => {
            try {
                // Import Strapi services
                const { addImage, deleteImage, uploadFile, updateImage } = await import('$lib/services/strapi');

                // Process deletions first
                if (imagesToRemove.length > 0) {
                    const deletionPromises = imagesToRemove.map((image) =>
                        deleteImage(image.documentId || image.strapiId || image.id)
                    );
                    await Promise.all(deletionPromises);
                }

                // Process additions
                if (imagesToAdd.length > 0) {
                    // Process one image at a time to better handle potential errors
                    for (const image of imagesToAdd) {
                        if (!image.file) {
                            console.error('Image missing file property:', image);
                            continue;
                        }

                        try {
                            // First upload the image file to Strapi's media library
                            const uploadedFile = await uploadFile(image.file);

                            if (!uploadedFile || !(uploadedFile as any).id) {
                                console.error('Invalid response from upload:', uploadedFile);
                                throw new Error('Failed to upload image file');
                            }

                            // Prepare image data for API using the uploaded file ID
                            const imageData = {
                                title: image.title || '',
                                description: '',
                                order: typeof image.order === 'number' ? image.order : 0,
                                // Use the uploadedFile.id for the image relation - Strapi expects a direct ID for media fields
                                image: (uploadedFile as any).id,
                                categories: {
                                    connect: [{ id: parseInt(categoryId) || categoryId }]
                                }
                            };

                            // Add the image in Strapi
                            const _ = await addImage(imageData);

                            // Process the URL from the uploaded file to ensure it's properly set in our UI
                            // This makes sure the image has a URL before we refresh the page
                            if ((uploadedFile as any).url) {
                                // Strapi sometimes returns relative URLs, make sure they're absolute
                                let imageUrl = (uploadedFile as any).url;
                                if (imageUrl.startsWith('/')) {
                                    const { STRAPI_API_URL } = await import('$lib/services/strapi');
                                    imageUrl = `${STRAPI_API_URL}${imageUrl}`;
                                }
                            }
                        } catch (err) {
                            console.error('Error processing image:', err);
                            throw err; // Re-throw to be caught by the outer catch block
                        }
                    }
                }

                // Process updates (order changes)
                if (imagesToUpdate.length > 0) {
                    const updatePromises = imagesToUpdate.map((image) => {
                        // Use documentId or strapiId for updates
                        const idToUpdate = image.documentId || image.strapiId || image.id;
                        return updateImage(idToUpdate, {
                            data: {
                                order: typeof image.order === 'number' ? image.order : 0
                            }
                        });
                    });
                    await Promise.all(updatePromises);
                }

                isModified = false;
                isSaving = false;
                showToast.success('Changes saved successfully');

                // Force page refresh to reflect the changes from the server
                // Use a small timeout to ensure the toast is shown before refresh
                setTimeout(() => {
                    // Add a timestamp to ensure cache is invalidated
                    const timestamp = new Date().getTime();
                    const url = new URL(window.location.href);
                    url.searchParams.set('t', timestamp.toString());
                    // Force a complete reload to ensure we get fresh data from the server
                    window.location.href = url.toString();
                }, 1000); // Increased timeout to allow toast to be visible
            } catch (error) {
                console.error('Error saving changes:', error);
                isSaving = false;
                showToast.error('Error saving changes. Please try again.');
            }
        };

        // Start processing changes
        processChanges();
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
    function confirmDiscardChanges() {
        imageStore.reset();
        isModified = false;
        showToast.info('Changes discarded');
        showDiscardDialog = false;
    }

    // Function to handle image removal
    function handleRemoveImage(id: string) {
        localImages = localImages.filter((img) => img.id !== id);
        isModified = true;
    }

    // Function to handle image update
    function handleUpdateImage(event: CustomEvent) {
        const { id, data } = event.detail;

        // Find the image to update
        const imageIndex = localImages.findIndex((img) => img.id === id);
        if (imageIndex === -1) {
            console.error('Image not found for update:', id);
            return;
        }

        // Extract the actual update fields from the nested structure
        const updateFields = data.data || {};

        // Convert order to number and ensure it's properly updated
        const newOrder = updateFields.order !== undefined ? Number(updateFields.order) : localImages[imageIndex].order;
        const oldOrder = localImages[imageIndex].order;

        // Find corresponding original image for comparison
        const originalImage = originalImages.find((img) => img.id === id);
        const originalOrder = originalImage ? originalImage.order : null;

        // Create a new image object to ensure reactivity
        const updatedImage = {
            ...localImages[imageIndex],
            ...updateFields,
            order: newOrder
        };

        // Update the image in the array
        localImages[imageIndex] = updatedImage;

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
        localImages = [...localImages, ...newImages];
        isModified = true;
    }

    // Function to handle image click for preview
    function handleImageClick(image: Image) {
        if (!showPreview) {
            previewImage = image;
            showPreview = true;
        }
    }

    // Function to close the preview
    async function closePreview() {
        showPreview = false;
        await tick();
        // Wait for the transition to complete using transitionend
        if (modalContainer) {
            await new Promise((resolve) => {
                const handleTransitionEnd = () => {
                    modalContainer.removeEventListener('transitionend', handleTransitionEnd);
                    resolve(undefined);
                };
                modalContainer.addEventListener('transitionend', handleTransitionEnd);
            });
        }
        previewImage = null;
    }
</script>

<svelte:window
    on:keydown={(e) => {
        if (showPreview && (e.key === 'Escape' || e.key === 'Enter')) {
            e.preventDefault();
            e.stopPropagation();
            closePreview();
        }
    }}
/>

{#if $adminMode && isModified}
    <div class="admin-actions mt-6 flex justify-end space-x-4 max-w-3xl m-auto md:px-4">
        <AlertDialog.Root bind:open={showDiscardDialog}>
            <AlertDialog.Trigger asChild let:builder>
                <Button variant="destructive" size="default" disabled={isSaving} builders={[builder]}>
                    Discard Changes
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Discard Changes</AlertDialog.Title>
                    <AlertDialog.Description>
                        Are you sure you want to discard your changes? This action cannot be undone.
                    </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                    <AlertDialog.Action on:click={confirmDiscardChanges}>Discard</AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Root>

        <Button variant="default" size="default" disabled={isSaving} on:click={saveChanges} class="flex items-center">
            {#if isSaving}
                <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                Saving...
            {:else}
                Save Changes
            {/if}
        </Button>
    </div>
{/if}

<div class="gallery-container py-6">
    <div class="grid grid-cols-1 gap-4 md:gap-6 max-w-3xl m-auto md:px-4">
        {#each sortedImages as image (image.id)}
            <div class="image-container relative">
                {#if $adminMode}
                    <div
                        class="order-controls absolute -left-12 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1"
                    >
                        <button
                            type="button"
                            class="p-1 bg-gray-200 hover:bg-gray-300 rounded-full"
                            on:click|preventDefault|stopPropagation={() => moveImageUp(image.id)}
                            disabled={sortedImages.indexOf(image) === 0}
                            title="Move up"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            class="p-1 bg-gray-200 hover:bg-gray-300 rounded-full"
                            on:click|preventDefault|stopPropagation={() => moveImageDown(image.id)}
                            disabled={sortedImages.indexOf(image) === sortedImages.length - 1}
                            title="Move down"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                {/if}
                <button
                    type="button"
                    class="bg-transparent border-0 p-0 w-full text-left cursor-pointer"
                    on:click|preventDefault|stopPropagation={() => handleImageClick(image)}
                    on:keydown={(e) => e.key === 'Enter' && handleImageClick(image)}
                    aria-label={image.title || 'View image'}
                >
                    <ImageCard
                        {image}
                        isCategory={true}
                        isAdmin={$adminMode}
                        on:remove={() => handleRemoveImage(image.id)}
                        on:update={handleUpdateImage}
                    />
                </button>
            </div>
        {/each}

        {#if $adminMode}
            <UploadPlaceholder on:addImages={(e) => handleAddImages(e.detail)} {categoryId} />
        {/if}
    </div>

    {#if showPreview && previewImage}
        <!-- Image Preview Modal -->
        <button
            bind:this={modalContainer}
            type="button"
            class="modal-container fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 backdrop-blur-sm {showPreview
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'}"
            on:click={closePreview}
            aria-label="Close modal overlay"
        >
            <button
                class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 focus:outline-none transition-all hover:scale-110"
                on:click={closePreview}
                aria-label="Close preview"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div
                class="relative overflow-hidden shadow-md max-w-[90vw] max-h-[90vh] transition-transform duration-300 {showPreview
                    ? 'scale-100'
                    : 'scale-95'}"
                role="dialog"
                aria-modal="true"
            >
                <img
                    src={previewImage.url}
                    alt={previewImage.alt || 'Image preview'}
                    class="max-w-full max-h-[90vh] object-contain"
                />
            </div>
        </button>
    {/if}
</div>
