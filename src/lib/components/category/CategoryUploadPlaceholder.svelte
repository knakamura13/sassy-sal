<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { AspectRatio } from '$lib/components/ui/aspect-ratio';
    import { Button } from '$lib/components/ui/button';
    import { getCategories } from '$lib/services/sanityContentService';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';
    import FileDropZone from '$lib/components/common/FileDropZone.svelte';

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
    let previewUrls: string[] = [];
    let selectedFiles: File[] = [];

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
        selectedFiles = [];
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = [];
        orderValue = 0;
        isUploading = false;
    }

    // Handle files selected from the FileDropZone
    function handleFilesSelected(event: CustomEvent<File[]>) {
        if (event.detail.length > 0) {
            const file = event.detail[0]; // Just take the first file for the thumbnail
            selectedFile = file;
            selectedFiles = [file];

            // Revoke any previous object URLs to prevent memory leaks
            previewUrls.forEach((url) => URL.revokeObjectURL(url));

            // Create new preview URL
            imagePreview = URL.createObjectURL(file);
            previewUrls = [imagePreview];
        }
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
            <span class="mb-2 text-3xl text-gray-500">+</span>
            <span class="font-medium text-gray-500">Add Category</span>
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

                    <!-- FileDropZone component -->
                    <FileDropZone
                        {selectedFiles}
                        {previewUrls}
                        multiple={false}
                        placeholderText="Drop a thumbnail here"
                        browseText="or click to browse"
                        previewClasses="max-h-32 max-w-full object-contain"
                        previewWrapperClasses="mb-2"
                        on:filesSelected={handleFilesSelected}
                    />
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
