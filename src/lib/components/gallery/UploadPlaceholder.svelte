<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Add categoryId as a prop to support category galleries
    export let categoryId: string = '';

    const dispatch = createEventDispatcher<{ addImages: Image[] }>();

    let imageFiles: File[] = [];
    let previewUrls: string[] = [];
    let dropZone: HTMLElement;
    let fileInput: HTMLInputElement;
    let isDragging = false;
    let open = false;
    let orderValue = 0; // Default order value
    let suggestedOrderValue = 0; // Keep track of the suggested value separately
    let isLoadingImages = false; // Loading state for fetching latest order

    // Fetch latest order value when dialog opens
    $: if (open && categoryId) {
        fetchLatestOrderValue();
    }

    onMount(() => {
        // Initial fetch on mount if categoryId is available
        if (categoryId) {
            fetchLatestOrderValue();
        }
    });

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    // Function to fetch the latest order value for images
    async function fetchLatestOrderValue() {
        isLoadingImages = true;
        try {
            // Dynamic import to avoid SSR issues
            const { getCategoryWithImages } = await import('$lib/services/sanity');

            // Add proper typing
            interface CategoryResponse {
                data?: {
                    attributes?: {
                        images?: {
                            data?: Array<{
                                attributes?: {
                                    order?: number;
                                };
                                order?: number;
                            }>;
                        };
                    };
                };
            }

            const categoryResponse = (await getCategoryWithImages(categoryId)) as CategoryResponse;
            const categoryData = categoryResponse?.data;

            if (
                categoryData &&
                categoryData.attributes?.images?.data &&
                Array.isArray(categoryData.attributes.images.data)
            ) {
                // Find the highest order value among images
                const highestOrder = categoryData.attributes.images.data.reduce((max: number, image: any) => {
                    // Check order in various possible locations in the object
                    const imageOrder =
                        typeof image.order === 'number'
                            ? image.order
                            : typeof image.attributes?.order === 'number'
                              ? image.attributes.order
                              : 0;

                    return imageOrder > max ? imageOrder : max;
                }, 0);

                // Set the order value to highest + 2 as a suggestion
                suggestedOrderValue = highestOrder + 2;
                orderValue = suggestedOrderValue;
            } else {
                // If no images exist, default to 0
                suggestedOrderValue = 0;
                orderValue = 0;
            }
        } catch (error) {
            console.error('Error fetching images for order value:', error);
            // Default to 0 if there's an error
            suggestedOrderValue = 0;
            orderValue = 0;
        } finally {
            isLoadingImages = false;
        }
    }

    function resetForm() {
        imageFiles = [];
        // Revoke all object URLs to prevent memory leaks
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = [];
        orderValue = 0;
        suggestedOrderValue = 0;
    }

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files) {
            processFiles(Array.from(files));
        }
    }

    function processFiles(files: File[]) {
        if (!files.length) return;

        // Reset existing previews
        resetForm();

        // Store all files
        imageFiles = files;

        // Create preview URLs for all files
        previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
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
            processFiles(Array.from(files));
        }
    }

    function handleSubmit() {
        if (imageFiles.length === 0) {
            showToast.error('Please select at least one image file');
            return;
        }

        // Create new image objects for all files
        const newImages: Image[] = imageFiles.map((file, index) => ({
            id: uuidv4(),
            url: previewUrls[index],
            alt: 'Image description',
            categoryId: categoryId || '1', // Default to first category if not specified
            file: file,
            order: orderValue // Use the same order value for all images (admin can reorder after upload)
        }));

        dispatch('addImages', newImages);
        open = false; // Close dialog after successful submission
    }
</script>

<div class="upload-placeholder w-full">
    <button
        type="button"
        class="w-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-16 hover:bg-gray-50 transition-colors cursor-pointer"
        on:click={() => (open = true)}
    >
        <div class="text-4xl text-gray-400 mb-2">+</div>
        <div class="text-gray-500 font-medium">Add Images</div>
    </button>

    <Dialog bind:open>
        <svelte:fragment slot="title">Add New Images</svelte:fragment>

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <p class="text-sm text-gray-500">
                Upload images to this gallery. All images will be displayed based on their order value.
            </p>

            <div class="space-y-2">
                <Label for="imageFile" class="text-left">Select Images*</Label>

                <!-- Hidden file input with multiple attribute -->
                <input
                    bind:this={fileInput}
                    type="file"
                    id="imageFile"
                    class="sr-only"
                    accept="image/*"
                    multiple
                    on:change={handleFileChange}
                />

                <!-- Custom Drop Zone -->
                <button
                    type="button"
                    bind:this={dropZone}
                    class="group w-full cursor-pointer p-6 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center transition-colors {isDragging
                        ? 'bg-gray-100 border-blue-500'
                        : previewUrls.length
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}"
                    on:click={handleDropZoneClick}
                    on:dragenter={(e) => handleDragEvent(e, true)}
                    on:dragover={(e) => handleDragEvent(e, true)}
                    on:dragleave={(e) => handleDragEvent(e, false)}
                    on:drop={handleDrop}
                >
                    {#if previewUrls.length}
                        <div class="grid grid-cols-3 gap-2 mb-2 max-h-48 overflow-y-auto w-full">
                            {#each previewUrls.slice(0, 6) as url, index}
                                <div class="relative">
                                    <img src={url} alt="Preview" class="h-20 w-20 object-cover mx-auto rounded" />
                                    {#if index === 0 && previewUrls.length > 6}
                                        <div
                                            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded text-white font-medium"
                                        >
                                            +{previewUrls.length - 6} more
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                        <p class="text-sm text-gray-600">
                            {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
                        </p>
                        <p class="text-xs text-gray-500 mt-1">Click to change</p>
                    {:else}
                        <svg
                            class="w-10 h-10 text-gray-400 mb-2 group-hover:text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        <p class="text-gray-600 group-hover:text-blue-600 font-medium">Drop images here</p>
                        <p class="text-gray-500 text-sm mt-1">or click to browse</p>
                    {/if}
                </button>
            </div>

            <!-- Order input field -->
            <div class="space-y-2">
                <Label for="orderValue" class="text-left">Order</Label>
                <div class="flex items-center space-x-2">
                    <Input
                        type="number"
                        id="orderValue"
                        bind:value={orderValue}
                        min="0"
                        class="w-32"
                        disabled={isLoadingImages}
                    />
                    {#if isLoadingImages}
                        <span class="text-xs text-gray-500 animate-pulse">Loading...</span>
                    {:else}
                        <span class="text-xs text-gray-500">Suggested value: {suggestedOrderValue}</span>
                    {/if}
                </div>
                <p class="text-xs text-gray-500">Lower values appear first. Leave as is to add at the end.</p>
            </div>

            <div class="flex flex-row justify-end space-x-3 pt-4">
                <button
                    type="button"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer"
                    on:click={() => (open = false)}
                >
                    Cancel
                </button>

                <Button type="submit" variant="default" disabled={imageFiles.length === 0}>
                    Add {imageFiles.length ? `(${imageFiles.length})` : ''}
                </Button>
            </div>
        </form>
    </Dialog>
</div>
