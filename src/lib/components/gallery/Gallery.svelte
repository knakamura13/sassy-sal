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
    let isModified = false;
    let isSaving = false; // New state for save operation

    // Alert dialog state
    let showDiscardDialog = false;

    // Image preview state
    let previewImage: Image | null = null;
    let showPreview = false;

    // Modal container reference
    let modalContainer: HTMLElement;

    // Initialize with provided category images
    onMount(() => {
        // Use the provided images for category mode
        localImages = images;
    });

    $: {
        // Update local images when category images change
        localImages = images;
    }

    // Function to handle saving changes
    function saveChanges() {
        if (isSaving) return; // Prevent multiple save operations
        isSaving = true;

        // Get the original images to compare with local images
        // If in category mode, use the provided images
        const originalImages = images;

        // Find images to add, update, or remove
        const imagesToAdd = localImages.filter((local) => !originalImages.some((orig) => orig.id === local.id));

        const imagesToRemove = originalImages.filter((orig) => !localImages.some((local) => local.id === orig.id));

        // Process changes
        const processChanges = async () => {
            try {
                // Import Strapi services
                const { addImage, deleteImage, uploadFile } = await import('$lib/services/strapi');

                // Process deletions first
                if (imagesToRemove.length > 0) {
                    const deletionPromises = imagesToRemove.map((image) => {
                        // Use documentId first if available, otherwise fall back to strapiId, then regular id
                        const idToDelete = image.documentId || image.strapiId || image.id;
                        return deleteImage(idToDelete);
                    });
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
                                // Use the uploadedFile.id for the image relation - Strapi expects a direct ID for media fields
                                image: (uploadedFile as any).id,
                                categories: {
                                    connect: [{ id: parseInt(categoryId) || categoryId }]
                                }
                            };

                            // Add the image in Strapi
                            const createdImage = await addImage(imageData);

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
        {#each localImages as image (image.id)}
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
                />
            </button>
        {/each}

        {#if $adminMode}
            <UploadPlaceholder on:addImages={(e) => handleAddImages(e.detail)} />
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
