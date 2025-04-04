<script lang="ts">
    import { imageStore, type Image } from '$lib/stores/imageStore';
    import { adminMode } from '$lib/stores/adminStore';
    import ImageCard from './ImageCard.svelte';
    import UploadPlaceholder from './UploadPlaceholder.svelte';
    import { onMount, tick } from 'svelte';

    // New props for category support
    export let images: Image[] = [];
    export let categoryId: string = '';

    // Local copy of images for editing in admin mode
    let localImages: Image[] = [];
    let isModified = false;
    let isSaving = false; // New state for save operation

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
                const { addImage, deleteImage } = await import('$lib/services/strapi');

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
                    const additionPromises = imagesToAdd.map((image) => {
                        // Prepare image data for API
                        const imageData = {
                            title: image.title || '',
                            description: '',
                            image: image.url,
                            // Handle numeric or string IDs for category
                            categories: {
                                connect: [{ id: parseInt(categoryId) || categoryId }]
                            }
                        };

                        return addImage(imageData);
                    });

                    await Promise.all(additionPromises);
                }

                isModified = false;
                isSaving = false;
                alert('Changes saved successfully');

                // Force page refresh to reflect the changes from the server
                // Use a small timeout to ensure the alert is shown before refresh
                setTimeout(() => {
                    // Add a timestamp to ensure cache is invalidated
                    const timestamp = new Date().getTime();
                    const url = new URL(window.location.href);
                    url.searchParams.set('t', timestamp.toString());
                    // Force a complete reload to ensure we get fresh data from the server
                    window.location.href = url.toString();
                }, 500);
            } catch (error) {
                console.error('Error saving changes:', error);
                isSaving = false;
                alert('Error saving changes. Please try again.');
            }
        };

        // Start processing changes
        processChanges();
    }

    // Function to discard changes
    function discardChanges() {
        imageStore.reset();
        isModified = false;
        alert('Changes discarded');
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

<div class="gallery-container py-6">
    <div class="grid grid-cols-1 gap-4">
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

    {#if $adminMode && isModified}
        <div class="admin-actions mt-6 flex space-x-4">
            <button
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center {isSaving
                    ? 'opacity-70 cursor-not-allowed'
                    : ''}"
                on:click={saveChanges}
                disabled={isSaving}
            >
                {#if isSaving}
                    <svg
                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
                        ></circle>
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
            </button>
            <button
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                on:click={discardChanges}
                disabled={isSaving}
            >
                Discard Changes
            </button>
        </div>
    {/if}

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
