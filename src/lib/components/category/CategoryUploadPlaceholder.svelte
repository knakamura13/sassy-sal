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

    // Define the structure for category items returned from API
    interface CategoryItem {
        attributes?: {
            order?: number;
        };
    }

    const dispatch = createEventDispatcher<{ addCategory: CategoryData }>();

    // Dialog state
    let open = false;

    // Form field state
    let categoryName = '';
    let orderValue = 0;

    // File upload state
    let selectedFile: File | null = null;
    let imagePreview = '';
    let dropZone: HTMLElement;
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Form process state
    let isUploading = false;
    let isLoadingCategories = false;
    let errorMessage = '';

    // Reset form data when dialog closes
    $: if (!open) resetForm();

    // When dialog opens, fetch latest order value
    $: if (open) fetchLatestOrderValue();

    // Fetch the highest order value from existing categories and add 1
    async function fetchLatestOrderValue() {
        isLoadingCategories = true;
        try {
            const categories = await getCategories();
            if (categories?.length > 0) {
                // Find the highest order value
                const highestOrder = categories.reduce((max: number, category: CategoryItem) => {
                    const currentOrder = category.attributes?.order || 0;
                    return currentOrder > max ? currentOrder : max;
                }, 0);

                orderValue = highestOrder + 1;
            } else {
                orderValue = 0;
            }
        } catch (error) {
            console.error('Error fetching categories for order value:', error);
            orderValue = 0;
        } finally {
            isLoadingCategories = false;
        }
    }

    function resetForm() {
        categoryName = '';
        selectedFile = null;
        imagePreview = '';
        errorMessage = '';
        isDragging = false;
        orderValue = 0;
        isUploading = false;
    }

    // File handling functions
    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) {
            processFile(input.files[0]);
        }
    }

    function processFile(file: File) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    // Drag and drop handling
    function handleDropZoneClick() {
        fileInput.click();
    }

    function handleDragEvent(event: DragEvent, entering: boolean) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = entering;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;

        const file = event.dataTransfer?.files?.[0];
        if (file) processFile(file);
    }

    // Form submission
    async function handleSubmit() {
        if (!categoryName.trim()) {
            showToast.error('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            const categoryData: CategoryData = {
                name: categoryName.trim(),
                order: Number(orderValue) || 0
            };

            if (selectedFile) {
                categoryData.thumbnail = selectedFile;
            }

            dispatch('addCategory', categoryData);
            open = false;
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
            <span class="mb-2 text-4xl text-gray-400">+</span>
            <span class="font-medium text-gray-500">Add Images</span>
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
                        {:else}
                            Add
                        {/if}
                    </Button>
                </div>
            </form>
        </Dialog>
    </div>
</AspectRatio>
