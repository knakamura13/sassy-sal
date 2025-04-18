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

<div class="image-card-wrapper relative !m-auto h-auto w-full">
    <div
        class="image-card relative inset-0 h-full w-full cursor-pointer overflow-hidden shadow-md transition-all duration-200 hover:scale-[1.01] hover:transform"
        data-image-id={image.id}
        data-has-url={!!image.url}
    >
        {#if image.url}
            <img src={image.url} alt={image.alt} class="h-full w-full object-cover" />
        {:else}
            <div class="flex h-full w-full items-center justify-center bg-gray-200">
                <p class="p-2 text-center text-sm text-gray-500">
                    {image.title || 'Untitled'}<br />
                    <span class="text-xs">(Image URL missing)</span>
                </p>
            </div>
        {/if}

        {#if image.title && !isCategory}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm font-medium md:text-base">{image.title}</h3>
            </div>
        {/if}

        {#if isAdmin}
            <div class="absolute right-4 top-4 flex gap-3">
                <button
                    class="!m-0 flex h-10 w-10 items-center justify-center rounded-[2px] bg-gray-800 bg-opacity-50 text-xl text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-lg focus:outline-none"
                    on:click|stopPropagation={handleEdit}
                    aria-label="Edit image"
                >
                    ✎
                </button>
                <button
                    class="!m-0 flex h-10 w-10 items-center justify-center rounded-[2px] bg-gray-800 bg-opacity-50 text-xl text-white shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-red-700 hover:shadow-lg focus:outline-none"
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
                    <p class="font-medium text-gray-600 group-hover:text-blue-600">Drop an image here</p>
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

            <Button type="submit" variant="default" class="font-didot" disabled={isUploading}>
                {#if isUploading}
                    <span class="mr-2">Updating...</span>
                {:else}
                    Update
                {/if}
            </Button>
        </div>
    </form>
</Dialog>
