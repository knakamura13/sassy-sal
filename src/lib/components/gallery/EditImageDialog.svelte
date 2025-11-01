<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { uploadFile } from '$lib/services/sanity/uploadService';
    import Dialog from '$lib/components/Dialog.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Define interface for Sanity uploaded asset
    interface SanityUploadedAsset {
        _id: string;
        url?: string;
    }

    const dispatch = createEventDispatcher<{
        update: { id: string; data: any };
    }>();

    export let open = false;
    export let image: Image;
    export let currentDisplayedUrl = '';

    // Edit dialog state
    let editOrder = 0;
    let editSpanTwoColumns = false;
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';
    let fileInput: HTMLInputElement;
    let isDragging = false;

    // Initialize form when dialog opens
    $: if (open) {
        editOrder = image.order || 0;
        console.log('[EditImageDialog] Setting editOrder to:', editOrder, 'from image.order:', image.order);
        editSpanTwoColumns = image.spanTwoColumns || false;
        console.log(
            '[EditImageDialog] Setting editSpanTwoColumns to:',
            editSpanTwoColumns,
            'from image.spanTwoColumns:',
            image.spanTwoColumns
        );
        imagePreview = currentDisplayedUrl || '';
        console.log('[EditImageDialog] Initialized:', {
            editOrder,
            editSpanTwoColumns,
            imageSpanTwoColumns: image.spanTwoColumns
        });
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
        editOrder = image.order || 0;
        selectedFile = null;
        imagePreview = currentDisplayedUrl || '';
        isUploading = false;
        errorMessage = '';
        isDragging = false;
    }

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    async function handleSubmit() {
        isUploading = true;
        errorMessage = '';

        try {
            // Prepare the update data
            const updateData: any = {
                data: {
                    order: editOrder,
                    spanTwoColumns: editSpanTwoColumns
                }
            };

            console.log('[EditImageDialog] Update data:', updateData);

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
            open = false;
        } catch (error) {
            errorMessage = 'Failed to update image. Please try again.';
        } finally {
            isUploading = false;
        }
    }
</script>

<Dialog bind:open maxWidth="lg">
    <svelte:fragment slot="title">Edit Image</svelte:fragment>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
            <Label for="editImageOrder">Display Order</Label>
            <Input
                type="number"
                id="editImageOrder"
                bind:value={editOrder}
                placeholder="0"
                min="0"
                disabled={isUploading}
            />
            <p class="text-xs text-gray-500">Images are displayed in ascending order (lower numbers first)</p>
        </div>

        <div class="flex items-center space-x-2">
            <Checkbox id="editSpanTwoColumns" bind:checked={editSpanTwoColumns} disabled={isUploading} />
            <Label for="editSpanTwoColumns">Span Two Columns</Label>
        </div>
        <p class="text-xs text-gray-500">
            When enabled, this image will span across two columns in multi-column layouts
        </p>

        <div class="space-y-2">
            <Label>Replace Image</Label>
            <div
                class="relative min-h-[150px] cursor-pointer rounded border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-gray-400"
                class:border-indigo-400={isDragging}
                on:click={handleDropZoneClick}
                on:keydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleDropZoneClick() : null)}
                tabindex="0"
                role="button"
                aria-label="Upload image"
                on:dragenter={(e) => handleDragEvent(e, true)}
                on:dragover={(e) => handleDragEvent(e, true)}
                on:dragleave={(e) => handleDragEvent(e, false)}
                on:drop={handleDrop}
            >
                <input bind:this={fileInput} type="file" class="hidden" accept="image/*" on:change={handleFileChange} />

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
            <Button type="button" variant="outline" on:click={() => (open = false)} disabled={isUploading}>
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
