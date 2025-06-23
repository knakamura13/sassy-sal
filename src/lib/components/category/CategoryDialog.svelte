<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { getCategories } from '$lib/services/sanity/categoryService';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';
    import FileDropZone from '$lib/components/common/FileDropZone.svelte';

    // Define the data structure that will be sent to Sanity
    interface CategoryData {
        name: string;
        order: number;
        password?: string;
        thumbnail?: File;
    }

    // Define the structure for category items returned from API
    interface CategoryItem {
        attributes?: {
            order?: number;
        };
    }

    // Define Sanity Category type locally
    interface SanityCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            password?: string;
            thumbnail?: {
                data?: {
                    attributes?: {
                        url?: string;
                        placeholderUrl?: string;
                        thumbnailUrl?: string;
                        fullSizeUrl?: string;
                        width?: number;
                        height?: number;
                    };
                };
            };
        };
    }

    type Mode = 'create' | 'edit';

    const dispatch = createEventDispatcher<{
        addCategory: CategoryData;
        addCategoryFast: {
            categoryData: Omit<CategoryData, 'thumbnail'>;
            thumbnailFile?: File;
            thumbnailPreview?: string;
        };
        update: { id: string | number; data: any };
    }>();

    // Props
    export let open = false;
    export let mode: Mode = 'create';
    export let category: SanityCategory | undefined = undefined;
    export let currentDisplayedUrl = '';

    // Form field state
    let categoryName = '';
    let orderValue = 0;
    let categoryPassword = '';

    // File upload state
    let selectedFile: File | null = null;
    let imagePreview = '';
    let previewUrls: string[] = [];
    let selectedFiles: File[] = [];

    // Form process state
    let isUploading = false;
    let isLoadingCategories = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Computed values
    $: isEditMode = mode === 'edit';
    $: dialogTitle = isEditMode ? 'Edit Category' : 'Add New Category';
    $: submitButtonText = isEditMode ? 'Save Changes' : 'Add';

    // Ensure we have default values for missing properties in edit mode
    $: categoryId = category?.id || 'placeholder';
    $: categoryNameFromProp = category?.attributes?.name || 'Missing Category';
    $: categoryOrder = category?.attributes?.order ?? 0;

    // Reset form data when dialog closes
    $: if (!open) resetForm();

    // When dialog opens, initialize form
    $: if (open) initializeForm();

    // Initialize form based on mode
    async function initializeForm() {
        if (isEditMode && category) {
            // Edit mode - populate with existing data
            categoryName = categoryNameFromProp;
            orderValue = categoryOrder;
            categoryPassword = category.attributes.password || '';
            imagePreview = currentDisplayedUrl || '';
        } else {
            // Create mode - fetch latest order value and reset form
            await fetchLatestOrderValue();
        }
    }

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
        categoryPassword = '';
        selectedFile = null;
        imagePreview = '';
        errorMessage = '';
        selectedFiles = [];
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls = [];
        orderValue = 0;
        isUploading = false;
        isDragging = false;
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
        if (isEditMode) {
            fileInput.click();
        }
    }

    // Common handler for drag events (edit mode only)
    function handleDragEvent(event: DragEvent, entering: boolean) {
        if (!isEditMode) return;
        event.preventDefault();
        event.stopPropagation();
        isDragging = entering;
    }

    function handleDrop(event: DragEvent) {
        if (!isEditMode) return;
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            processFile(files[0]);
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
            if (isEditMode) {
                // Edit mode
                const updateData: { data: { name: string; order: number; password?: string; thumbnail?: File } } = {
                    data: {
                        name: categoryName.trim(),
                        order: Number(orderValue) || 0,
                        password: categoryPassword.trim() || undefined
                    }
                };

                // Add thumbnail file if selected
                if (selectedFile) {
                    updateData.data.thumbnail = selectedFile;
                }

                // Store old name to check if name changed
                const oldName = categoryNameFromProp;

                // Dispatch the update event
                dispatch('update', {
                    id: categoryId,
                    data: updateData
                });

                // Update local state to reflect changes (via reactive declarations)
                if (category && category.attributes) {
                    category.attributes.name = categoryName.trim();
                    category.attributes.order = Number(orderValue) || 0;
                }

                // Close dialog after successful submission
                open = false;

                // Prevent immediate navigation if name changed to give Sanity time to update
                if (oldName !== categoryName.trim()) {
                    showToast.success('Category updated. Refreshing page in 2 seconds...');
                    setTimeout(() => {
                        window.location.href = window.location.href;
                    }, 2000);
                }
            } else {
                // Create mode - fast creation with optimistic thumbnail rendering
                const categoryData: Omit<CategoryData, 'thumbnail'> = {
                    name: categoryName.trim(),
                    order: Number(orderValue) || 0
                };

                if (categoryPassword.trim()) {
                    categoryData.password = categoryPassword.trim();
                }

                // Store data before dialog closes (to avoid it being cleared by reactive resetForm)
                const categoryNameForToast = categoryName.trim();
                const thumbnailFile = selectedFile;
                const thumbnailPreview = imagePreview;

                // Close dialog BEFORE dispatching the event
                open = false;

                // Wait for dialog to close
                setTimeout(() => {
                    // Dispatch the fast creation event with separate thumbnail data
                    dispatch('addCategoryFast', {
                        categoryData,
                        thumbnailFile: thumbnailFile || undefined,
                        thumbnailPreview: thumbnailPreview || undefined
                    });

                    // Show feedback using stored name
                    showToast.success(`Creating category "${categoryNameForToast}"...`);

                    // Reset form after everything is done
                    resetForm();
                }, 200);
            }
        } catch (error: any) {
            if (isEditMode) {
                // Handle specific error types for edit mode
                if (error?.status === 404 || (typeof error?.message === 'string' && error.message.includes('404'))) {
                    errorMessage = 'This category no longer exists. It may have been deleted from the server.';
                } else {
                    errorMessage = `Failed to update category: ${error?.message || 'Unknown error'}`;
                }
                console.error('Error updating category:', error);
            } else {
                // Handle create mode errors
                errorMessage = 'Failed to create category. Please try again.';
                console.error('Error creating category:', error);
            }
        } finally {
            isUploading = false;
        }
    }
</script>

<Dialog bind:open maxWidth="lg">
    <svelte:fragment slot="title">{dialogTitle}</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="category-name" class="font-garamond">Category Name*</Label>
            <Input
                type="text"
                id="category-name"
                bind:value={categoryName}
                placeholder="e.g. Weddings"
                class="font-garamond"
                required
                disabled={isUploading}
            />
        </div>

        <div class="space-y-2">
            <Label for="category-order" class="font-garamond">Display Order*</Label>
            <Input
                type="number"
                id="category-order"
                bind:value={orderValue}
                placeholder="0"
                class="font-garamond"
                min="0"
                disabled={isUploading || isLoadingCategories}
            />
            {#if !isEditMode && isLoadingCategories}
                <p class="text-xs text-gray-500">Loading suggested order value...</p>
            {:else}
                <p class="text-xs text-gray-500">Categories are displayed in ascending order (lower numbers first)</p>
            {/if}
        </div>

        <div class="space-y-2">
            <Label for="category-password" class="font-garamond">Password Protection</Label>
            <Input
                type="password"
                id="category-password"
                bind:value={categoryPassword}
                placeholder="Set password (leave empty for public access)"
                class="font-garamond"
                disabled={isUploading}
            />
            <p class="text-xs text-gray-500">
                Leave empty to make the category publicly accessible, or set a password to protect it.
            </p>
        </div>

        <div class="space-y-2">
            <Label for="category-image" class="font-garamond">Thumbnail Image</Label>

            {#if isEditMode}
                <!-- Edit mode - manual drag/drop -->
                <div
                    class="relative min-h-[150px] cursor-pointer rounded border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400"
                    class:border-indigo-400={isDragging}
                    on:click={handleDropZoneClick}
                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleDropZoneClick() : null)}
                    on:dragenter={(e) => handleDragEvent(e, true)}
                    on:dragover={(e) => handleDragEvent(e, true)}
                    on:dragleave={(e) => handleDragEvent(e, false)}
                    on:drop={handleDrop}
                    tabindex="0"
                    role="button"
                    aria-label="Upload image"
                >
                    <input
                        type="file"
                        bind:this={fileInput}
                        class="hidden"
                        accept="image/*"
                        on:change={handleFileChange}
                    />

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
            {:else}
                <!-- Create mode - FileDropZone component -->
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
            {/if}
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
                disabled={isUploading}
            >
                Cancel
            </button>

            <Button type="submit" variant="default" class="font-didot" disabled={!categoryName || isUploading}>
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
                    {isEditMode ? 'Saving...' : 'Creating...'}
                {:else}
                    {submitButtonText}
                {/if}
            </Button>
        </div>
    </form>
</Dialog>
