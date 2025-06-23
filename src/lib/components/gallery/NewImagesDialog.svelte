<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Import from relative path
    import ImageDropZone from '$lib/components/gallery/ImageDropZone.svelte';

    // Type definition for category response
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

    const dispatch = createEventDispatcher<{ addImages: Image[] }>();

    export let open = false;
    export let categoryId: string = '';

    let imageFiles: File[] = [];
    let previewUrls: string[] = [];
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

    /**
     * Fetches the latest order value for images in the current category
     */
    async function fetchLatestOrderValue() {
        isLoadingImages = true;
        try {
            // Dynamic import to avoid SSR issues
            const { getCategoryWithImages } = await import('$lib/services/sanity/categoryService');
            const categoryResponse = (await getCategoryWithImages(categoryId)) as CategoryResponse;

            // Calculate the highest order value from images
            const highestOrder = getHighestOrderValue(categoryResponse);

            // Set the order value to highest + 2 as a suggestion
            suggestedOrderValue = highestOrder + 2;
            orderValue = suggestedOrderValue;
        } catch (error) {
            console.error('Error fetching images for order value:', error);
            // Default to 0 if there's an error
            suggestedOrderValue = 0;
            orderValue = 0;
        } finally {
            isLoadingImages = false;
        }
    }

    /**
     * Extracts the highest order value from the category response
     */
    function getHighestOrderValue(categoryResponse: CategoryResponse): number {
        const images = categoryResponse?.data?.attributes?.images?.data;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return 0;
        }

        return images.reduce((max: number, image: any) => {
            // Check order in various possible locations in the object
            const imageOrder =
                typeof image.order === 'number'
                    ? image.order
                    : typeof image.attributes?.order === 'number'
                      ? image.attributes.order
                      : 0;

            return imageOrder > max ? imageOrder : max;
        }, 0);
    }

    /**
     * Resets the form state and cleans up resources
     */
    function resetForm() {
        imageFiles = [];
        // Revoke all object URLs to prevent memory leaks
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = [];
        orderValue = suggestedOrderValue || 0;
    }

    /**
     * Processes uploaded files and creates preview URLs
     */
    function handleImagesSelected(files: File[]) {
        if (!files.length) return;

        // Reset existing previews
        resetForm();

        // Store all files
        imageFiles = files;

        // Create preview URLs for all files
        previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    }

    /**
     * Handles form submission and dispatches image data
     */
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
            order: orderValue + index * 2 // Increment order for each image with spacing of 2
        }));

        dispatch('addImages', newImages);
        open = false; // Close dialog after successful submission
    }
</script>

<Dialog bind:open>
    <svelte:fragment slot="title">Add New Images</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <p class="text-sm text-gray-500">
            Upload images to this gallery. All images will be displayed based on their order value.
        </p>

        <div class="space-y-2">
            <Label for="imageFile" class="text-left">Select Images*</Label>

            <!-- Image selection component -->
            <ImageDropZone
                selectedFiles={imageFiles}
                {previewUrls}
                on:filesSelected={(event) => handleImagesSelected(event.detail)}
            />
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
                    <span class="animate-pulse text-xs text-gray-500">Loading...</span>
                {:else}
                    <span class="text-xs text-gray-500">Suggested value: {suggestedOrderValue}</span>
                {/if}
            </div>
            <p class="text-xs text-gray-500">Lower values appear first. Leave as is to add at the end.</p>
        </div>

        <div class="flex flex-row justify-end space-x-3 pt-4">
            <button
                type="button"
                class="cursor-pointer rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
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
