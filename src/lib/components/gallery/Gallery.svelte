<script lang="ts">
    import { imageStore, type Image } from '$lib/stores/imageStore';
    import { adminMode } from '$lib/stores/adminStore';
    import ImageCard from './ImageCard.svelte';
    import UploadPlaceholder from './UploadPlaceholder.svelte';
    import { onMount, tick } from 'svelte';

    // New props for category support
    export let images: Image[] = [];
    export let isCategory: boolean = false;
    export let categoryId: string = '';

    // Local copy of images for editing in admin mode
    let localImages: Image[] = [];
    let isModified = false;

    // Image preview state
    let previewImage: Image | null = null;
    let showPreview = false;

    // Modal container reference
    let modalContainer: HTMLElement;

    // Subscribe to the image store and get updates if not in category mode
    onMount(() => {
        if (!isCategory) {
            const unsubscribe = imageStore.subscribe((value) => {
                localImages = value;
            });
            return unsubscribe;
        } else {
            // If in category mode, use the provided images
            localImages = images;
        }
    });

    $: {
        // Update local images when category images change
        if (isCategory) {
            localImages = images;
        }
    }

    // Function to handle saving changes
    function saveChanges() {
        imageStore.set(localImages);
        isModified = false;
        // In a real application, this would send data to a server
        alert('Changes saved successfully (mock)');
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
        // If in category mode, set the category ID for new images
        if (isCategory && categoryId) {
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
        if (isCategory && !showPreview) {
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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each localImages as image (image.id)}
            <button
                type="button"
                class="bg-transparent border-0 p-0 w-full text-left rounded-lg cursor-pointer"
                on:click|preventDefault|stopPropagation={() => handleImageClick(image)}
                on:keydown={(e) => e.key === 'Enter' && handleImageClick(image)}
                aria-label={image.title || 'View image'}
            >
                <ImageCard {image} {isCategory} isAdmin={$adminMode} on:remove={() => handleRemoveImage(image.id)} />
            </button>
        {/each}

        {#if $adminMode}
            <UploadPlaceholder on:addImages={(e) => handleAddImages(e.detail)} />
        {/if}
    </div>

    {#if $adminMode && isModified}
        <div class="admin-actions mt-6 flex space-x-4">
            <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded" on:click={saveChanges}>
                Save Changes
            </button>
            <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded" on:click={discardChanges}>
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
                class="relative overflow-hidden rounded-md shadow-md max-w-[90vw] max-h-[90vh] transition-transform duration-300 {showPreview
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

                {#if previewImage.title}
                    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 text-white">
                        <h3 class="text-lg font-medium">{previewImage.title}</h3>
                    </div>
                {/if}
            </div>
        </button>
    {/if}
</div>
