<script lang="ts">
    import { onMount } from 'svelte';

    import { adminMode } from '$lib/stores/adminStore';
    import { imageStore, type Image } from '$lib/stores/imageStore';
    import { showToast } from '$lib/utils';
    import { sortImagesByOrder, ensureImageOrder, cloneImages, findImageChanges } from '$lib/utils/imageUtils';
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

    // Next category navigation state
    let nextCategory: { id: string; name: string } | null = null;
    let isLoadingNextCategory = false;

    // Image preview state
    let previewImage: Image | null = null;
    let showPreview = false;

    // Initialize with provided category images
    onMount(() => {
        // Initialize with order values and create deep copies
        const processedImages = ensureImageOrder(images);
        originalImages = cloneImages(processedImages);
        localImages = cloneImages(processedImages);

        // Fetch next category if we have a valid category ID and order
        if (categoryId && categoryOrder !== undefined) {
            fetchNextCategory();
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
                return; // No next category if there's only 1 or 0 categories
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

    // Function to handle saving changes
    async function saveChanges() {
        if (isSaving) return; // Prevent multiple save operations
        isSaving = true;

        // Find images to add, update, or remove
        const { imagesToAdd, imagesToRemove, imagesToUpdate } = findImageChanges(localImages, originalImages);

        // Process changes
        try {
            // Import Sanity services
            const { addImage, deleteImage, updateImage } = await import('$lib/services/sanity');

            // Process deletions first
            if (imagesToRemove.length > 0) {
                const deletionPromises = imagesToRemove.map((image) => deleteImage(image.id));
                await Promise.all(deletionPromises);
            }

            // Process additions
            for (const image of imagesToAdd) {
                if (!image.file) continue;

                try {
                    // Prepare image data for API
                    const imageData = {
                        order: Number(typeof image.order === 'number' ? image.order : image.order || 0),
                        image: image.file,
                        category: categoryId
                    };

                    // Add the image in Sanity
                    await addImage(imageData);
                } catch (err) {
                    throw err;
                }
            }

            // Process updates
            for (const image of imagesToUpdate) {
                try {
                    // Prepare update data
                    const updateData: any = {
                        order: Number(typeof image.order === 'number' ? image.order : image.order || 0)
                    };

                    // Include file if present
                    if (image.file) {
                        updateData.image = image.file;
                    }

                    // Update the image
                    await updateImage(image.id, updateData);
                } catch (error) {
                    throw error;
                }
            }

            isModified = false;
            showToast.success('Changes saved successfully');

            // Force page refresh to reflect the changes from the server
            setTimeout(() => {
                const timestamp = new Date().getTime();
                const url = new URL(window.location.href);
                url.searchParams.set('t', timestamp.toString());
                window.location.href = url.toString();
            }, 1000);
        } catch (error) {
            console.error('Error saving changes:', error);
            showToast.error('Error saving changes. Please try again.');
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

            // Make sure newOrder is a number
            const orderValue = typeof newOrder === 'number' ? newOrder : Number(newOrder || 0);

            // Update the order of the specific image
            localImages[imageIndex] = {
                ...localImages[imageIndex],
                order: orderValue
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
        imageStore.reset();
        localImages = cloneImages(originalImages);
        isModified = false;
        showToast.info('Changes discarded');
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

        // Create a new image object to ensure reactivity
        const updatedImage = {
            ...localImages[imageIndex],
            order: newOrder,
            file: imageFile // Store file for later processing
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

    // Handle preview close
    function handlePreviewClose() {
        showPreview = false;
        previewImage = null;
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
/>

{#if $adminMode && isModified}
    <AdminControls {isSaving} on:save={saveChanges} on:discard={discardChanges} />
{/if}

<div class="gallery-container m-auto max-w-[1000px] py-6 pb-24">
    <div class="grid w-full grid-cols-1 gap-6">
        {#each sortedImages as image (image.id)}
            <div class="image-container relative">
                {#if $adminMode}
                    <div
                        class="order-controls absolute -left-12 top-1/2 flex -translate-y-1/2 transform flex-col space-y-2"
                    >
                        <button
                            type="button"
                            class="rounded-full bg-gray-200 p-2 {sortedImages.indexOf(image) === 0
                                ? 'pointer-events-none opacity-40'
                                : 'hover:bg-gray-300'}"
                            on:click|preventDefault|stopPropagation={() => moveImageUp(image.id)}
                            disabled={sortedImages.indexOf(image) === 0}
                            title="Move up"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
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
                            class="rounded-full bg-gray-200 p-2 {sortedImages.indexOf(image) === sortedImages.length - 1
                                ? 'pointer-events-none opacity-40'
                                : 'hover:bg-gray-300'}"
                            on:click|preventDefault|stopPropagation={() => moveImageDown(image.id)}
                            disabled={sortedImages.indexOf(image) === sortedImages.length - 1}
                            title="Move down"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
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
                    class="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
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

    <CategoryNavigation {nextCategory} />

    <ImagePreview image={previewImage} show={showPreview} on:close={handlePreviewClose} />
</div>
