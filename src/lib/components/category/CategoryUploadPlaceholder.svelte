<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { AspectRatio } from '$lib/components/ui/aspect-ratio';
    import { Button } from '$lib/components/ui/button';
    import { getCategories } from '$lib/services/sanity';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';

    // Define the data structure that will be sent to Sanity
    interface CategoryData {
        name: string;
        order: number;
        thumbnail?: File;
    }

    const dispatch = createEventDispatcher<{ addCategory: CategoryData }>();

    let open = false;
    let categoryName = '';
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let dropZone: HTMLElement;
    let fileInput: HTMLInputElement;
    let isDragging = false;
    let orderValue = 0; // Default order value
    let isLoadingCategories = false;

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    // When dialog opens, fetch the latest order value
    $: if (open) {
        fetchLatestOrderValue();
    }

    // Fetch the highest order value from existing categories and add 1
    async function fetchLatestOrderValue() {
        isLoadingCategories = true;
        try {
            const categories = await getCategories();
            if (categories && categories.length > 0) {
                // Find the highest order value
                const highestOrder = categories.reduce((max: number, category: any) => {
                    const currentOrder = category.attributes?.order || 0;
                    return currentOrder > max ? currentOrder : max;
                }, 0);

                // Set the order value to highest + 1
                orderValue = highestOrder + 1;
            } else {
                // If no categories exist, default to 0
                orderValue = 0;
            }
        } catch (error) {
            console.error('Error fetching categories for order value:', error);
            // Default to 0 if there's an error
            orderValue = 0;
        } finally {
            isLoadingCategories = false;
        }
    }

    function resetForm() {
        categoryName = '';
        selectedFile = null;
        imagePreview = '';
        isUploading = false;
        errorMessage = '';
        isDragging = false;
        orderValue = 0;
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

    async function handleSubmit() {
        if (!categoryName.trim()) {
            showToast.error('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the data for Sanity
            const categoryData: CategoryData = {
                name: categoryName.trim(),
                order: Number(orderValue) || 0 // Convert to number with fallback to 0
            };

            // If there's a selected file, add it directly to the category data
            // Sanity service will handle the upload
            if (selectedFile) {
                categoryData.thumbnail = selectedFile;
            }

            // Dispatch the event to create the category
            dispatch('addCategory', categoryData);
            open = false; // Close dialog after successful submission
        } catch (error) {
            errorMessage = 'Failed to create category. Please try again.';
        } finally {
            isUploading = false;
        }
    }
</script>

<AspectRatio ratio={3 / 4} class="!m-auto !aspect-[3/4] max-h-[770px] bg-muted">
    <div
        class="category-card !m-auto block h-full max-h-[770px] w-full border-2 border-dashed border-gray-300 transition-all duration-300"
    >
        <button
            type="button"
            class="flex h-full w-full cursor-pointer flex-col items-center justify-center p-4 transition-colors hover:bg-gray-100"
            on:click={() => (open = true)}
        >
            <div class="mb-2 text-4xl text-gray-400">+</div>
            <div class="font-medium text-gray-500">Add Images</div>
        </button>

        <Dialog bind:open>
            <svelte:fragment slot="title">Add New Category</svelte:fragment>

            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
                <div class="space-y-2">
                    <Label for="categoryName" class="font-garamond">Category Name*</Label>
                    <Input
                        type="text"
                        id="categoryName"
                        bind:value={categoryName}
                        placeholder="e.g. Weddings"
                        class="font-garamond"
                        required
                        disabled={isUploading}
                    />
                </div>

                <div class="space-y-2">
                    <Label for="categoryOrder" class="font-garamond">Display Order*</Label>
                    <Input
                        type="number"
                        id="categoryOrder"
                        bind:value={orderValue}
                        placeholder="0"
                        class="font-garamond"
                        min="0"
                        disabled={isUploading || isLoadingCategories}
                    />
                    {#if isLoadingCategories}
                        <p class="text-xs text-gray-500">Loading suggested order value...</p>
                    {:else}
                        <p class="text-xs text-gray-500">
                            Categories are displayed in ascending order (lower numbers first)
                        </p>
                    {/if}
                </div>

                <div class="space-y-2">
                    <Label for="categoryImage" class="font-garamond">Thumbnail Image</Label>

                    <!-- Hidden file input -->
                    <input
                        bind:this={fileInput}
                        type="file"
                        id="categoryImage"
                        class="sr-only"
                        accept="image/*"
                        on:change={handleFileChange}
                        disabled={isUploading}
                    />

                    <!-- Custom Drop Zone -->
                    <button
                        type="button"
                        bind:this={dropZone}
                        class="font-garamond group flex w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors {isDragging
                            ? 'border-blue-500 bg-gray-100'
                            : imagePreview
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}"
                        on:click={handleDropZoneClick}
                        on:dragenter={(e) => handleDragEvent(e, true)}
                        on:dragover={(e) => handleDragEvent(e, true)}
                        on:dragleave={(e) => handleDragEvent(e, false)}
                        on:drop={handleDrop}
                        disabled={isUploading}
                    >
                        {#if imagePreview}
                            <div class="mb-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    class="mx-auto max-h-32 max-w-full object-contain"
                                />
                            </div>
                            <p class="text-sm text-gray-600">{selectedFile?.name || 'Image selected'}</p>
                            <p class="mt-1 text-xs text-gray-500">Click to change</p>
                        {:else}
                            <svg
                                class="mb-2 h-10 w-10 text-gray-400 group-hover:text-blue-500"
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
                            <p class="font-medium text-gray-600 group-hover:text-blue-600">Drop a thumbnail here</p>
                            <p class="mt-1 text-sm text-gray-500">or click to browse</p>
                        {/if}
                    </button>
                </div>

                {#if errorMessage}
                    <div class="rounded bg-red-100 p-2 text-sm text-red-800">
                        {errorMessage}
                    </div>
                {/if}

                <div class="flex flex-row justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        class="font-didot cursor-pointer rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                        on:click={() => (open = false)}
                    >
                        Cancel
                    </button>

                    <Button type="submit" variant="default" class="font-didot" disabled={!categoryName || isUploading}>
                        {#if isUploading}
                            <span class="mr-2">Creating...</span>
                            <!-- Simple loading spinner -->
                            <div
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                            ></div>
                        {:else}
                            Add
                        {/if}
                    </Button>
                </div>
            </form>
        </Dialog>
    </div>
</AspectRatio>
