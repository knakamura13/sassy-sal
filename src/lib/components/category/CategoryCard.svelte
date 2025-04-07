<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { getRandomImageByQuery } from '$lib/services/unsplash';
    import { STRAPI_API_URL } from '$lib/services/strapi';
    import { uploadFile } from '$lib/services/strapi';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Label } from '$lib/components/ui/label';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';

    // Define Strapi Category type locally
    interface StrapiCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            description?: string;
            thumbnail?: any; // Using any type to handle various Strapi response structures
        };
    }

    // Define interface for Strapi uploaded file
    interface StrapiUploadedFile {
        id: number;
        name: string;
        url: string;
    }

    export let category: StrapiCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
        update: { id: string | number; data: any };
    }>();

    // State for image URL (will be populated from Unsplash if missing)
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

    // Make sure category has the expected structure to prevent errors
    if (!category) {
        console.error(`Category is undefined!`);
        category = {
            id: 'placeholder',
            attributes: {
                name: 'Missing Category',
                order: 0
            }
        };
    } else if (!category.attributes) {
        console.error(`Category is missing attributes`);
        category.attributes = {
            name: (category as any).name || 'Unknown Category',
            order: (category as any).order || 0
        };
    } else if (category.attributes.order === undefined) {
        // Ensure order has a default value if missing
        category.attributes.order = 0;
    }

    onMount(async () => {
        await loadImage();
    });

    // Function to load image from thumbnail or Unsplash
    async function loadImage() {
        isLoading = true;

        // Check if the category has a thumbnail property
        if (category.attributes.thumbnail) {
            // Handle different possible structures for thumbnail data from Strapi
            let thumbnailUrl = null;

            // Structure 1: Modern Strapi v4 with data.attributes.url
            if (category.attributes.thumbnail.data && category.attributes.thumbnail.data.attributes?.url) {
                thumbnailUrl = category.attributes.thumbnail.data.attributes.url;
            }
            // Structure 2: Object with direct URL property
            else if (category.attributes.thumbnail.url) {
                thumbnailUrl = category.attributes.thumbnail.url;
            }
            // Structure 3: Nested data array format
            else if (
                Array.isArray(category.attributes.thumbnail.data) &&
                category.attributes.thumbnail.data.length > 0
            ) {
                const firstItem = category.attributes.thumbnail.data[0];
                if (firstItem && 'attributes' in firstItem && firstItem.attributes && 'url' in firstItem.attributes) {
                    thumbnailUrl = firstItem.attributes.url;
                }
            }

            // If we found a URL, process it
            if (thumbnailUrl) {
                // Format the URL properly
                if (thumbnailUrl.startsWith('http')) {
                    imageUrl = thumbnailUrl;
                } else if (thumbnailUrl.startsWith('/')) {
                    imageUrl = `${STRAPI_API_URL}${thumbnailUrl}`;
                } else {
                    imageUrl = `${STRAPI_API_URL}/${thumbnailUrl}`;
                }

                // Verify the image loads correctly with a timeout
                try {
                    const testImg = new Image();

                    // Set a timeout to prevent waiting too long for image load
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Image load timeout')), 5000);
                    });

                    const loadPromise = new Promise((resolve, reject) => {
                        testImg.onload = () => {
                            resolve('success');
                        };
                        testImg.onerror = (e) => {
                            reject(new Error('Image load failed'));
                        };
                        testImg.src = imageUrl;
                    });

                    // Race between load and timeout
                    await Promise.race([loadPromise, timeoutPromise]);
                    isLoading = false;
                } catch (error) {
                    await useUnsplashFallback();
                }
            } else {
                await useUnsplashFallback();
            }
        } else {
            await useUnsplashFallback();
        }
    }

    // Helper to use Unsplash fallback
    async function useUnsplashFallback() {
        try {
            imageUrl = await getRandomImageByQuery(category.attributes.name);
        } catch (error) {
            // Use a default image as last resort
            imageUrl =
                'https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D&w=1000&q=80';
        }
        isLoading = false;
    }

    function handleRemove() {
        dispatch('remove', category.id);
    }

    function handleEdit() {
        editName = category.attributes.name;
        editOrder = category.attributes.order;
        imagePreview = imageUrl;
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
        editName = category.attributes.name;
        editOrder = category.attributes.order;
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
            alert('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the update data
            const updateData: any = {
                data: {
                    name: editName,
                    order: editOrder
                }
            };

            // If there's a selected file, upload it first
            if (selectedFile) {
                try {
                    const uploadedFile = (await uploadFile(selectedFile)) as StrapiUploadedFile;

                    if (uploadedFile && uploadedFile.id) {
                        // Add the thumbnail ID to the category data using Strapi v4 relationship format
                        updateData.data.thumbnail = {
                            connect: [{ id: uploadedFile.id }]
                        };
                    } else {
                        errorMessage = 'Invalid response from server during thumbnail upload.';
                    }
                } catch (uploadError) {
                    console.error('Error uploading thumbnail:', uploadError);
                    // Continue without the thumbnail if upload fails
                    errorMessage = 'Failed to upload thumbnail, but category will be updated without it.';
                }
            }

            try {
                // Dispatch the update event
                dispatch('update', {
                    id: category.id,
                    data: updateData.data
                });

                // Update local state to reflect changes
                category.attributes.name = editName.trim();
                category.attributes.order = Number(editOrder) || 0;

                // Force a reload of the image when a new one is uploaded
                if (selectedFile) {
                    // Small delay to ensure the upload completes
                    setTimeout(async () => {
                        await loadImage();
                    }, 1000);
                }

                // Close dialog after successful submission
                editDialogOpen = false;
            } catch (updateError: any) {
                // Check for 404 errors specifically
                if (
                    updateError?.status === 404 ||
                    (typeof updateError?.message === 'string' && updateError.message.includes('404'))
                ) {
                    errorMessage = 'This category no longer exists. It may have been deleted from the server.';
                } else {
                    errorMessage = `Failed to update category: ${updateError?.message || 'Unknown error'}`;
                }
                console.error('Error updating category:', updateError);
            }
        } catch (error) {
            console.error('Error in category update process:', error);
            errorMessage = 'Failed to update category. Please try again.';
        } finally {
            isUploading = false;
        }
    }
</script>

<a
    href={isAdmin ? `/${category.attributes.name}?admin=true` : `/${category.attributes.name}`}
    class="category-card aspect-[3/4] min-w-[240px] max-w-[320px] w-full !m-auto block transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1 relative h-full"
>
    <div
        class="category-card-border absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
    ></div>
    <div class="w-full h-full relative">
        {#if !isLoading}
            <div class="w-full h-full transition-all duration-300 hover:brightness-110 hover:contrast-[1.05]">
                <img
                    src={imageUrl}
                    alt={category.attributes.name}
                    class="w-full h-full object-cover image-filter transition-[filter] duration-300 ease-out"
                />
            </div>
        {/if}

        <div class="absolute inset-0 flex items-center justify-center">
            <h3
                class="flex justify-center items-center card-title font-didot text-2xl transition-all duration-300 text-white text-center px-4 h-24 w-full bg-black bg-opacity-20 shadow-text"
            >
                {category.attributes.name}
            </h3>
        </div>

        {#if isAdmin}
            <div class="absolute top-2 right-2 flex space-x-2">
                <button
                    class="bg-gray-800 bg-opacity-30 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    class="bg-gray-800 bg-opacity-30 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none shadow-md"
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
<Dialog.Root bind:open={editDialogOpen}>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>Edit Category</Dialog.Title>
        </Dialog.Header>

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
                    class="group w-full cursor-pointer p-6 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center transition-colors font-garamond {isDragging
                        ? 'bg-gray-100 border-blue-500'
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
                            <img src={imagePreview} alt="Preview" class="max-h-32 max-w-full object-contain mx-auto" />
                        </div>
                        <p class="text-sm text-gray-600">{selectedFile?.name || 'Current image'}</p>
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
                        <p class="text-gray-600 group-hover:text-blue-600 font-medium">Drop a thumbnail here</p>
                        <p class="text-gray-500 text-sm mt-1">or click to browse</p>
                    {/if}
                </button>
            </div>

            {#if errorMessage}
                <div class="p-2 bg-red-100 text-red-800 rounded text-sm">
                    {errorMessage}
                </div>
            {/if}

            <Dialog.Footer class="flex flex-row justify-end space-x-3">
                <Dialog.Close
                    class="font-didot px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer"
                >
                    Cancel
                </Dialog.Close>

                <Button type="submit" variant="default" class="font-didot" disabled={!editName || isUploading}>
                    {#if isUploading}
                        <span class="mr-2">Updating...</span>
                        <!-- Simple loading spinner -->
                        <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {:else}
                        Update
                    {/if}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<style lang="scss">
    .image-filter {
        filter: sepia(0.2) brightness(0.92) saturate(0.85);
    }

    .shadow-text {
        text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.8);
    }

    .category-card:hover {
        .card-title {
            opacity: 1;
            transform: scale(1.1);
            background-color: rgba(0, 0, 0, 0.2);
            --tw-backdrop-blur: blur(2px);
            -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast)
                var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert)
                var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
            backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast)
                var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert)
                var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
        }
        .category-card-border {
            opacity: 1;
        }
        .image-filter {
            filter: sepia(0) brightness(1) saturate(1.1);
        }
    }
</style>
