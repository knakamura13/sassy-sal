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

    export let category: SanityCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
        update: { id: string | number; data: any };
    }>();

    // State for image URLs
    let placeholderUrl = '';
    let thumbnailUrl = '';
    let fullSizeUrl = '';
    let currentDisplayedUrl = '';

    // Loading states
    let isLoading = true;
    let thumbnailLoaded = false;
    let fullSizeLoaded = false;

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

    // Progressive loading logic
    $: {
        // Extract URLs from the category data
        if (categoryThumbnail?.data?.attributes) {
            const attrs = categoryThumbnail.data.attributes;
            placeholderUrl = attrs.placeholderUrl || '';
            thumbnailUrl = attrs.url || '';
            fullSizeUrl = attrs.fullSizeUrl || attrs.url || '';
        }

        // Set initial display URL to placeholder if available
        if (placeholderUrl && !currentDisplayedUrl) {
            currentDisplayedUrl = placeholderUrl;
        }
    }

    onMount(async () => {
        await loadImage();
    });

    // Function to load image in progressive stages
    async function loadImage() {
        isLoading = true;

        try {
            if (!categoryThumbnail) {
                usePlaceholderBackground();
                return;
            }

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
                        usePlaceholderBackground();
                    }
                }
            } else {
                usePlaceholderBackground();
            }

            isLoading = false;
        } catch (error) {
            console.error('Error in progressive image loading:', error);
            usePlaceholderBackground();
        }
    }

    // Helper to use placeholder background when no image is available
    function usePlaceholderBackground() {
        // Set currentDisplayedUrl to empty string to trigger placeholder background display
        currentDisplayedUrl = '';
        isLoading = false;
    }

    function handleRemove(e: Event) {
        e.preventDefault();
        dispatch('remove', categoryId);
    }

    function handleEdit(e: Event) {
        e.preventDefault();
        editName = categoryName;
        editOrder = categoryOrder;
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
        editName = categoryName;
        editOrder = categoryOrder;
        selectedFile = null;
        imagePreview = currentDisplayedUrl;
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
    href={String(categoryId).startsWith('temp-') ? '#' : isAdmin ? `/${categoryName}?admin=true` : `/${categoryName}`}
    class="category-card group relative block h-full w-full overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
    class:pointer-events-none={String(categoryId).startsWith('temp-')}
>
    <div
        class="category-card-border pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
    ></div>
    <div class="relative h-full w-full">
        {#if String(categoryId).startsWith('temp-')}
            <div class="absolute left-0 right-0 top-0 z-10 bg-blue-600 px-2 py-1 text-center text-xs text-white">
                Saving...
            </div>
        {/if}
        {#if !isLoading}
            {#if currentDisplayedUrl}
                <div class="h-full w-full">
                    <img
                        src={currentDisplayedUrl}
                        alt={categoryName}
                        class="h-full w-full object-cover transition-opacity duration-500"
                        style="opacity: 1;"
                    />
                </div>
            {:else}
                <!-- Placeholder pattern when no image is available -->
                <div
                    class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200"
                >
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
                        <p class="mt-2 text-xs">No image</p>
                    </div>
                </div>
            {/if}
        {:else}
            <!-- Loading placeholder - smaller version of the image without blur -->
            <div class="flex h-full w-full items-center justify-center bg-gray-100">
                {#if placeholderUrl}
                    <img src={placeholderUrl} alt="Loading" class="h-full w-full object-cover" />
                {:else}
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                {/if}
            </div>
        {/if}

        <!-- Category name -->
        <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4 text-white transition-opacity duration-300 group-hover:opacity-0"
        >
            <h2 class="text-right text-2xl font-medium tracking-wide">{categoryName}</h2>
        </div>

        <!-- Admin Controls Overlay -->
        {#if isAdmin}
            <div
                class="absolute right-0 top-0 z-10 flex space-x-1 rounded-bl-md bg-gray-900 bg-opacity-60 p-1 shadow-lg"
            >
                <button
                    type="button"
                    class="aspect-square h-10 w-10 rounded p-1 text-white hover:bg-gray-600"
                    on:click|stopPropagation={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    type="button"
                    class="aspect-square h-10 w-10 rounded p-1 text-white hover:bg-red-600"
                    on:click|stopPropagation={handleRemove}
                    aria-label="Remove category"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</a>

<!-- Edit Dialog -->
{#if editDialogOpen}
    <Dialog bind:open={editDialogOpen} maxWidth="lg">
        <svelte:fragment slot="title">Edit Category</svelte:fragment>

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div class="space-y-2">
                <Label for="category-name">Name</Label>
                <Input id="category-name" type="text" bind:value={editName} placeholder="Category name" required />
            </div>

            <div class="space-y-2">
                <Label for="category-order">Order</Label>
                <Input id="category-order" type="number" bind:value={editOrder} placeholder="Display order" min="0" />
            </div>

            <div class="space-y-2">
                <Label>Thumbnail</Label>
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
            </div>

            {#if errorMessage}
                <div class="rounded bg-red-50 p-4 text-sm text-red-500">{errorMessage}</div>
            {/if}

            <div class="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    on:click={() => (editDialogOpen = false)}
                    disabled={isUploading}
                >
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
{/if}
