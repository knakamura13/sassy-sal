<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { showToast } from '$lib/utils';
    import Dialog from '$lib/components/Dialog.svelte';

    // Define Sanity Category type locally
    interface SanityCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            thumbnail?: any;
        };
    }

    export let category: SanityCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
        update: { id: string | number; data: any };
    }>();

    // State for image URL
    let imageUrl = '';
    let isLoading = true;

    // Edit dialog state
    let editDialogOpen = false;
    let editName = '';
    let editOrder = 0;
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Ensure we have default values for missing properties
    $: categoryId = category?.id || 'placeholder';
    $: categoryName = category?.attributes?.name || 'Missing Category';
    $: categoryOrder = category?.attributes?.order ?? 0;
    $: categoryThumbnail = category?.attributes?.thumbnail;

    onMount(async () => {
        await loadImage();
    });

    // Function to load image from thumbnail or show placeholder background
    async function loadImage() {
        isLoading = true;

        try {
            if (!categoryThumbnail) {
                usePlaceholderBackground();
                return;
            }

            // Extract thumbnail URL from different possible structures
            const thumbnailUrl = categoryThumbnail.data?.attributes?.url || categoryThumbnail.url || null;

            if (!thumbnailUrl) {
                usePlaceholderBackground();
                return;
            }

            imageUrl = thumbnailUrl;

            // Verify image loads correctly with timeout
            const testImg = new Image();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Image load timeout')), 5000);
            });

            const loadPromise = new Promise((resolve, reject) => {
                testImg.onload = () => resolve('success');
                testImg.onerror = () => reject(new Error('Image load failed'));
                testImg.src = imageUrl;
            });

            // Race between load and timeout
            await Promise.race([loadPromise, timeoutPromise]);
            isLoading = false;
        } catch (error) {
            usePlaceholderBackground();
        }
    }

    // Helper to use placeholder background when no image is available
    function usePlaceholderBackground() {
        // Set imageUrl to empty string to trigger placeholder background display
        imageUrl = '';
        isLoading = false;
    }

    function handleRemove() {
        dispatch('remove', categoryId);
    }

    function handleEdit() {
        editName = categoryName;
        editOrder = categoryOrder;
        imagePreview = imageUrl || '';
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
        editName = categoryName;
        editOrder = categoryOrder;
        selectedFile = null;
        imagePreview = imageUrl;
        isUploading = false;
        errorMessage = '';
        isDragging = false;
    }

    // Reset form data when the dialog is closed
    $: if (!editDialogOpen) {
        resetForm();
    }

    async function handleSubmit() {
        if (!editName.trim()) {
            showToast.error('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the update data
            const updateData: { data: { name: string; order: number; thumbnail?: File } } = {
                data: {
                    name: editName.trim(),
                    order: Number(editOrder) || 0
                }
            };

            // Add thumbnail file if selected
            if (selectedFile) {
                updateData.data.thumbnail = selectedFile;
            }

            // Store old name to check if name changed
            const oldName = categoryName;

            // Dispatch the update event
            dispatch('update', {
                id: categoryId,
                data: updateData
            });

            // Update local state to reflect changes (via reactive declarations)
            if (category && category.attributes) {
                category.attributes.name = editName.trim();
                category.attributes.order = Number(editOrder) || 0;
            }

            // Force a reload of the image when a new one is uploaded
            if (selectedFile) {
                setTimeout(async () => {
                    try {
                        await loadImage();
                    } catch (reloadError) {
                        // Silent failure - image will use placeholder if needed
                    }
                }, 1500);
            }

            // Close dialog after successful submission
            editDialogOpen = false;

            // Prevent immediate navigation if name changed to give Sanity time to update
            if (oldName !== editName.trim()) {
                showToast.success('Category updated. Refreshing page in 2 seconds...');
                setTimeout(() => {
                    window.location.href = window.location.href;
                }, 2000);
            }
        } catch (error: any) {
            // Handle specific error types
            if (error?.status === 404 || (typeof error?.message === 'string' && error.message.includes('404'))) {
                errorMessage = 'This category no longer exists. It may have been deleted from the server.';
            } else {
                errorMessage = `Failed to update category: ${error?.message || 'Unknown error'}`;
            }
            console.error('Error updating category:', error);
        } finally {
            isUploading = false;
        }
    }
</script>

<a
    href={isAdmin ? `/${categoryName}?admin=true` : `/${categoryName}`}
    class="category-card relative block h-full w-full overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-lg"
>
    <div
        class="category-card-border pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
    ></div>
    <div class="relative h-full w-full">
        {#if !isLoading}
            {#if imageUrl}
                <div class="h-full w-full transition-all duration-300 hover:brightness-110 hover:contrast-[1.05]">
                    <img
                        src={imageUrl}
                        alt={categoryName}
                        class="image-filter h-full w-full object-cover transition-[filter] duration-300 ease-out"
                    />
                </div>
            {:else}
                <!-- Placeholder background for categories without images -->
                <div class="category-placeholder h-full w-full transition-all duration-300"></div>
            {/if}
        {/if}

        <div
            class="card-title absolute bottom-0 left-0 right-0 flex w-full items-center justify-end bg-gradient-to-t from-black/40 to-transparent transition-all duration-300"
            style="padding: clamp(8px, 2vw, 20px) clamp(12px, 3vw, 24px) clamp(8px, 2vw, 20px) clamp(8px, 2vw, 20px);"
        >
            <h3 class="font-didot text-balance text-3xl text-white lg:text-[32px]">
                {categoryName}
            </h3>
        </div>

        {#if isAdmin}
            <div class="absolute right-2 top-2 flex space-x-2">
                <button
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 bg-opacity-30 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:outline-none"
                    on:click|stopPropagation|preventDefault={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 bg-opacity-30 text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-red-700 hover:shadow-lg focus:outline-none"
                    on:click|stopPropagation|preventDefault={handleRemove}
                    aria-label="Remove category"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</a>

<!-- Edit Category Dialog -->
<Dialog bind:open={editDialogOpen}>
    <svelte:fragment slot="title">Edit Category</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="editCategoryName" class="font-garamond">Category Name*</Label>
            <Input
                type="text"
                id="editCategoryName"
                bind:value={editName}
                placeholder="e.g. Weddings"
                class="font-garamond"
                required
                disabled={isUploading}
            />
        </div>

        <div class="space-y-2">
            <Label for="editCategoryOrder" class="font-garamond">Display Order*</Label>
            <Input
                type="number"
                id="editCategoryOrder"
                bind:value={editOrder}
                placeholder="0"
                class="font-garamond"
                min="0"
                disabled={isUploading}
            />
            <p class="text-xs text-gray-500">Categories are displayed in ascending order (lower numbers first)</p>
        </div>

        <div class="space-y-2">
            <Label for="editCategoryImage" class="font-garamond">Thumbnail Image</Label>

            <!-- Hidden file input -->
            <input
                bind:this={fileInput}
                type="file"
                id="editCategoryImage"
                class="sr-only"
                accept="image/*"
                on:change={handleFileChange}
                disabled={isUploading}
            />

            <!-- Custom Drop Zone -->
            <button
                type="button"
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
                        <img src={imagePreview} alt="Preview" class="mx-auto max-h-32 max-w-full object-contain" />
                    </div>
                    <p class="text-sm text-gray-600">{selectedFile?.name || 'Current image'}</p>
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
                on:click={() => (editDialogOpen = false)}
            >
                Cancel
            </button>

            <Button type="submit" variant="default" class="font-didot" disabled={!editName || isUploading}>
                {#if isUploading}
                    <span class="mr-2">Updating...</span>
                {:else}
                    Update
                {/if}
            </Button>
        </div>
    </form>
</Dialog>

<style lang="scss">
    @use 'sass:color';
    @use '$lib/styles/variables' as vars;

    .image-filter {
        filter: contrast(0.95) brightness(1.05) saturate(0.95);
    }

    /* Styling for the category placeholder when no thumbnail is available */
    .category-placeholder {
        background-color: color.adjust(vars.$secondary-color, $lightness: 10%);
    }

    .category-card:hover {
        .category-card-border {
            opacity: 1;
        }
        .image-filter {
            filter: contrast(1) brightness(0.98) saturate(1.05);
        }
    }
</style>
