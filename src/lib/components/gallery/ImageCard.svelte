<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { uploadFile } from '$lib/services/sanity';
    import Dialog from '$lib/components/Dialog.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Define interface for Sanity uploaded asset (new)
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

    function handleRemove() {
        dispatch('remove', image.id);
    }

    function handleEdit(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        editTitle = image.title || '';
        editOrder = image.order || 0;
        imagePreview = image.url || '';
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
        imagePreview = image.url || '';
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

<div class="image-card-wrapper aspect-square w-full relative !m-auto">
    <div
        class="image-card transition-all duration-200 inset-0 relative overflow-hidden shadow-md w-full h-full hover:transform hover:scale-[1.01] cursor-pointer"
        data-image-id={image.id}
        data-has-url={!!image.url}
    >
        {#if image.url}
            <img src={image.url} alt={image.alt} class="w-full h-full object-cover" />
        {:else}
            <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                <p class="text-gray-500 text-sm p-2 text-center">
                    {image.title || 'Untitled'}<br />
                    <span class="text-xs">(Image URL missing)</span>
                </p>
            </div>
        {/if}

        {#if image.title && !isCategory}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm md:text-base font-medium">{image.title}</h3>
            </div>
        {/if}

        {#if isAdmin}
            <div class="absolute top-2 right-2 flex gap-2">
                <button
                    class="!m-0 bg-gray-800 bg-opacity-0 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 shadow-md hover:shadow-lg focus:outline-none transition-all duration-200"
                    on:click|stopPropagation={handleEdit}
                    aria-label="Edit image"
                >
                    ✎
                </button>
                <button
                    class="!m-0 bg-gray-800 bg-opacity-0 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow-md hover:shadow-lg focus:outline-none transition-all duration-200"
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
<Dialog bind:open={editDialogOpen}>
    <svelte:fragment slot="title">Edit Image</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="editImageOrder" class="font-garamond">Display Order*</Label>
            <Input
                type="number"
                id="editImageOrder"
                bind:value={editOrder}
                placeholder="0"
                class="font-garamond"
                min="0"
                disabled={isUploading}
            />
            <p class="text-xs text-gray-500">Images are displayed in ascending order (lower numbers first)</p>
        </div>

        <div class="space-y-2">
            <Label for="editImageFile" class="font-garamond">Image File*</Label>

            <!-- Hidden file input -->
            <input
                bind:this={fileInput}
                type="file"
                id="editImageFile"
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
                    <p class="text-gray-600 group-hover:text-blue-600 font-medium">Drop an image here</p>
                    <p class="text-gray-500 text-sm mt-1">or click to browse</p>
                {/if}
            </button>
        </div>

        {#if errorMessage}
            <div class="p-2 bg-red-100 text-red-800 rounded text-sm">
                {errorMessage}
            </div>
        {/if}

        <div class="flex flex-row justify-end space-x-3 pt-4">
            <button
                type="button"
                class="font-didot px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer"
                on:click={() => (editDialogOpen = false)}
            >
                Cancel
            </button>

            <Button type="submit" variant="default" class="font-didot" disabled={isUploading}>
                {#if isUploading}
                    <span class="mr-2">Updating...</span>
                    <!-- Simple loading spinner -->
                    <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                {:else}
                    Update
                {/if}
            </Button>
        </div>
    </form>
</Dialog>
