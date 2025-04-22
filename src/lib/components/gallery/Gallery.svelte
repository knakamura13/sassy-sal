<script lang="ts">
    import { onMount } from 'svelte';

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

    // Function to handle saving changes
    async function saveChanges() {
        if (isSaving) return; // Prevent multiple save operations
        isSaving = true;

        // Find images to add, update, or remove
        const { imagesToAdd, imagesToRemove, imagesToUpdate } = findImageChanges(localImages, originalImages);

        // Calculate total operations for progress tracking
        uploadTotal = imagesToRemove.length + imagesToAdd.length + imagesToUpdate.length;
        uploadStep = 0;

        // Only show progress dialog if there are operations to perform
        if (uploadTotal > 0) {
            uploadMessage = 'Preparing to process images...';
            uploadPercentage = 0;
            showProgressDialog = true;
        }

        // Process changes
        try {
            // Import Sanity services
            const { addImage, deleteImage, updateImage } = await import('$lib/services/sanity');

            // Process deletions first
            if (imagesToRemove.length > 0) {
                uploadOperation = 'Deleting';
                uploadMessage = `Deleting images...`;

                for (const image of imagesToRemove) {
                    try {
                        await deleteImage(image.id);
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
            if (imagesToAdd.length > 0) {
                uploadOperation = 'Uploading';
                uploadMessage = `Uploading new images...`;

                for (let i = 0; i < imagesToAdd.length; i++) {
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

                        uploadMessage = `Uploading image ${i + 1} of ${imagesToAdd.length}...`;

                        // Add the image in Sanity
                        await addImage(imageData);

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
            if (imagesToUpdate.length > 0) {
                uploadOperation = 'Updating';
                uploadMessage = `Updating images...`;

                for (let i = 0; i < imagesToUpdate.length; i++) {
                    const image = imagesToUpdate[i];
                    try {
                        // Prepare update data
                        const updateData: any = {
                            order: Number(typeof image.order === 'number' ? image.order : image.order || 0)
                        };

                        // Include file if present
                        if (image.file) {
                            updateData.image = image.file;
                            uploadMessage = `Updating image ${i + 1} of ${imagesToUpdate.length} (with new file)...`;
                        } else {
                            uploadMessage = `Updating image ${i + 1} of ${imagesToUpdate.length}...`;
                        }

                        // Update the image
                        await updateImage(image.id, updateData);

                        uploadStep++;
                        uploadPercentage = Math.round((uploadStep / uploadTotal) * 100);
                    } catch (error) {
                        console.error('Error updating image:', error);
                        uploadStep++;
                        // Continue with other updates even if one fails
                    }
                }
            }

            // Set final progress state before hiding dialog
            uploadMessage = 'All images processed successfully!';
            uploadPercentage = 100;

            // Keep the dialog visible for a moment so user can see completion
            await new Promise((resolve) => setTimeout(resolve, 1000));
            showProgressDialog = false;

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

<div class="gallery-container m-auto max-w-screen-md py-6 pb-24">
    <div class="grid w-full grid-cols-1 gap-6">
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
                        <div class="mt-1 text-center text-sm text-muted-foreground">
                            {uploadPercentage}%
                        </div>
                    </div>
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
    </AlertDialog.Content>
</AlertDialog.Root>

<style lang="scss">
</style>
