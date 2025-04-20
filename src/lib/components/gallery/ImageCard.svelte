<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { uploadFile } from '$lib/services/sanity';
    import Dialog from '$lib/components/Dialog.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Define interface for Sanity uploaded asset
    interface SanityUploadedAsset {
        _id: string;
        url?: string;
    }

    export let image: Image;
    export let isAdmin: boolean = false;
    export let isCategory: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string;
        update: { id: string; data: any };
    }>();

    // Image loading states
    let isLoading = true;
    let placeholderUrl = image.placeholderUrl || '';
    let thumbnailUrl = image.url || '';
    let fullSizeUrl = image.fullSizeUrl || image.url || '';
    let currentDisplayedUrl = '';
    let thumbnailLoaded = false;
    let fullSizeLoaded = false;

    // Responsive image URLs
    let responsiveSmallUrl = '';
    let responsiveMediumUrl = '';
    let responsiveLargeUrl = '';

    // Edit dialog state
    let editDialogOpen = false;
    let editTitle = '';
    let editOrder = 0;
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Set initial URL to placeholder if available
    $: {
        if (placeholderUrl && !currentDisplayedUrl) {
            currentDisplayedUrl = placeholderUrl;
        }
    }

    onMount(async () => {
        // Set responsive URLs if available from image object
        if (image.responsiveUrls) {
            responsiveSmallUrl = image.responsiveUrls.small || '';
            responsiveMediumUrl = image.responsiveUrls.medium || '';
            responsiveLargeUrl = image.responsiveUrls.large || '';
        } else {
            // Use the best available URLs for responsive sizes
            responsiveSmallUrl = image.url || image.fullSizeUrl || '';
            responsiveMediumUrl = image.fullSizeUrl || image.url || '';
            responsiveLargeUrl = image.fullSizeUrl || '';
        }

        await loadImage();
    });

    // Function to load image in progressive stages
    async function loadImage() {
        isLoading = true;

        try {
            // Start with placeholder if available
            if (placeholderUrl) {
                currentDisplayedUrl = placeholderUrl;
            }

            // Function to preload an image and return a promise
            const preloadImage = (url: string): Promise<void> => {
                return new Promise((resolve, reject) => {
                    if (!url) {
                        reject(new Error('No URL provided'));
                        return;
                    }

                    const img = new Image();
                    const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), 7000);

                    img.onload = () => {
                        clearTimeout(timeoutId);
                        resolve();
                    };

                    img.onerror = () => {
                        clearTimeout(timeoutId);
                        reject(new Error('Failed to load image'));
                    };

                    img.src = url;
                });
            };

            // Load thumbnail
            if (thumbnailUrl) {
                try {
                    await preloadImage(thumbnailUrl);
                    currentDisplayedUrl = thumbnailUrl;
                    thumbnailLoaded = true;

                    // Start loading full-size image after thumbnail is displayed
                    if (fullSizeUrl && fullSizeUrl !== thumbnailUrl) {
                        preloadImage(fullSizeUrl)
                            .then(() => {
                                currentDisplayedUrl = fullSizeUrl;
                                fullSizeLoaded = true;
                            })
                            .catch((err) => {
                                console.warn('Failed to load full-size image:', err);
                                // Keep using thumbnail if full-size fails
                            });
                    } else {
                        fullSizeLoaded = true; // Mark as loaded if no separate full-size URL
                    }
                } catch (error) {
                    console.warn('Failed to load thumbnail:', error);
                    // If thumbnail fails but we have a placeholder, keep using placeholder
                    if (!placeholderUrl) {
                        useEmptyPlaceholder();
                    }
                }
            } else {
                useEmptyPlaceholder();
            }

            isLoading = false;
        } catch (error) {
            console.error('Error in progressive image loading:', error);
            useEmptyPlaceholder();
        }
    }

    // Helper for when no image is available
    function useEmptyPlaceholder() {
        currentDisplayedUrl = '';
        isLoading = false;
    }

    function handleRemove() {
        dispatch('remove', image.id);
    }

    function handleEdit(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        editTitle = image.title || '';
        editOrder = image.order || 0;
        imagePreview = currentDisplayedUrl || '';
        editDialogOpen = true;
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            processFile(input.files[0]);
        }
    }

    function processFile(file: File) {
        selectedFile = file;

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
    }

    function handleDropZoneClick() {
        fileInput.click();
    }

    // Common handler for drag events
    function handleDragEvent(event: DragEvent, entering: boolean) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = entering;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }

    function resetForm() {
        editTitle = image.title || '';
        editOrder = image.order || 0;
        selectedFile = null;
        imagePreview = currentDisplayedUrl || '';
        isUploading = false;
        errorMessage = '';
        isDragging = false;
    }

    // Reset form data when the dialog is closed
    $: if (!editDialogOpen) {
        resetForm();
    }

    async function handleSubmit() {
        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the update data
            const updateData: any = {
                data: {
                    title: editTitle,
                    order: editOrder
                }
            };

            // If there's a selected file, upload it first
            if (selectedFile) {
                try {
                    // Now using Sanity's uploadFile function
                    const uploadedAsset = (await uploadFile(selectedFile)) as SanityUploadedAsset;

                    if (uploadedAsset && uploadedAsset._id) {
                        // Add the image to the update data in Sanity format
                        updateData.data.image = selectedFile;
                    } else {
                        errorMessage = 'Invalid response from server during image upload.';
                    }
                } catch (uploadError) {
                    errorMessage = 'Failed to upload image, but other fields will be updated.';
                }
            }

            // Dispatch the update event
            dispatch('update', {
                id: image.id,
                data: updateData
            });

            // Close dialog after successful submission
            editDialogOpen = false;
        } catch (error) {
            errorMessage = 'Failed to update image. Please try again.';
        } finally {
            isUploading = false;
        }
    }
</script>

<div class="image-card-wrapper relative !m-auto h-auto w-full">
    <div
        class="image-card relative inset-0 h-full w-full cursor-pointer overflow-hidden shadow-md transition-all duration-200 hover:scale-[1.01] hover:transform"
        data-image-id={image.id}
        data-has-url={!!currentDisplayedUrl}
    >
        {#if isLoading}
            <!-- Loading state with medium-resolution placeholder -->
            <div class="flex h-full w-full items-center justify-center bg-gray-100">
                {#if placeholderUrl}
                    <img src={placeholderUrl} alt="Loading" class="h-full w-full object-cover" />
                {:else}
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                {/if}
            </div>
        {:else if currentDisplayedUrl}
            <!-- Responsive image with picture element and srcset -->
            <picture>
                <!-- For small devices like phones (width < 640px) -->
                <source
                    media="(max-width: 639px)"
                    srcset={responsiveSmallUrl || currentDisplayedUrl}
                    type="image/webp"
                />

                <!-- For medium devices like tablets (640px <= width < 1024px) -->
                <source
                    media="(min-width: 640px) and (max-width: 1023px)"
                    srcset={responsiveMediumUrl || currentDisplayedUrl}
                    type="image/webp"
                />

                <!-- For large devices like desktops (width >= 1024px) -->
                <source
                    media="(min-width: 1024px)"
                    srcset={responsiveLargeUrl || currentDisplayedUrl}
                    type="image/webp"
                />

                <!-- Fallback image for browsers that don't support picture/srcset -->
                <img
                    src={currentDisplayedUrl}
                    alt={image.alt}
                    class="h-full w-full object-cover transition-opacity duration-500"
                    style="opacity: 1;"
                    loading="lazy"
                />
            </picture>
        {:else}
            <!-- Fallback when no image is available -->
            <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200">
                <div class="text-center text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <p class="mt-2 text-xs">{image.title || 'Untitled'}</p>
                </div>
            </div>
        {/if}

        {#if image.title && !isCategory && currentDisplayedUrl}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm font-medium md:text-base">{image.title}</h3>
            </div>
        {/if}

        {#if isAdmin}
            <div class="absolute right-4 top-4 flex gap-3">
                <button
                    class="!m-0 flex h-10 w-10 items-center justify-center rounded-[2px] bg-gray-800 bg-opacity-50 text-xl text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:outline-none"
                    on:click|stopPropagation={handleEdit}
                    aria-label="Edit image"
                >
                    ✎
                </button>
                <button
                    class="!m-0 flex h-10 w-10 items-center justify-center rounded-[2px] bg-gray-800 bg-opacity-50 text-xl text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-red-700 hover:shadow-lg focus:outline-none"
                    on:click|stopPropagation={handleRemove}
                    aria-label="Remove image"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</div>

<!-- Edit Image Dialog -->
<Dialog bind:open={editDialogOpen} maxWidth="lg">
    <svelte:fragment slot="title">Edit Image</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="editImageTitle">Image Title</Label>
            <Input
                type="text"
                id="editImageTitle"
                bind:value={editTitle}
                placeholder="Enter image title"
                class="w-full"
            />
        </div>

        <div class="space-y-2">
            <Label for="editImageOrder">Display Order</Label>
            <Input
                type="number"
                id="editImageOrder"
                bind:value={editOrder}
                placeholder="0"
                min="0"
                disabled={isUploading}
            />
            <p class="text-xs text-gray-500">Images are displayed in ascending order (lower numbers first)</p>
        </div>

        <div class="space-y-2">
            <Label>Replace Image</Label>
            <div
                class="relative min-h-[150px] cursor-pointer rounded border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400"
                class:border-indigo-400={isDragging}
                on:click={handleDropZoneClick}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleDropZoneClick() : null)}
                tabindex="0"
                role="button"
                aria-label="Upload image"
                on:dragenter={(e) => handleDragEvent(e, true)}
                on:dragover={(e) => handleDragEvent(e, true)}
                on:dragleave={(e) => handleDragEvent(e, false)}
                on:drop={handleDrop}
            >
                <input bind:this={fileInput} type="file" class="hidden" accept="image/*" on:change={handleFileChange} />

                {#if imagePreview}
                    <img src={imagePreview} alt="Preview" class="mx-auto max-h-[200px] object-contain" />
                    <p class="mt-2 text-center text-sm text-gray-500">Click or drag to change the image</p>
                {:else}
                    <div class="text-center">
                        <svg
                            class="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                        <p class="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p class="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                {/if}
            </div>
        </div>

        {#if errorMessage}
            <div class="rounded bg-red-50 p-4 text-sm text-red-500">{errorMessage}</div>
        {/if}

        <div class="flex justify-end space-x-2">
            <Button type="button" variant="outline" on:click={() => (editDialogOpen = false)} disabled={isUploading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
                {#if isUploading}
                    <svg
                        class="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Saving...
                {:else}
                    Save Changes
                {/if}
            </Button>
        </div>
    </form>
</Dialog>
