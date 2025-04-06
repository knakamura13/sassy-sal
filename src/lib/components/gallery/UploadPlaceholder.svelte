<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import type { Image } from '$lib/stores/imageStore';
    import * as Dialog from '$lib/components/ui/dialog';

    // Add categoryId as a prop to support category galleries
    export let categoryId: string = '';

    const dispatch = createEventDispatcher<{ addImages: Image[] }>();

    let imageTitle = '';
    let imageAlt = '';
    let imageFile: File | null = null;
    let previewUrl: string | null = null;
    let dropZone: HTMLElement;
    let fileInput: HTMLInputElement;
    let isDragging = false;
    let open = false;

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    function resetForm() {
        imageTitle = '';
        imageAlt = '';
        imageFile = null;
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }
    }

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        processFile(files?.[0]);
    }

    function processFile(file: File | undefined) {
        if (!file) return;

        imageFile = file;

        // Create preview URL
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(imageFile);
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

    function handleSubmit() {
        if (!imageFile) {
            alert('Please select an image file');
            return;
        }

        // Create a new image object with the file's object URL
        const newImage: Image = {
            id: uuidv4(),
            url: previewUrl as string,
            alt: imageAlt.trim() || 'Image description',
            title: imageTitle.trim() || undefined,
            categoryId: categoryId || '1', // Default to first category if not specified
            file: imageFile
        };

        dispatch('addImages', [newImage]);
        open = false; // Close dialog after successful submission
    }
</script>

<div class="upload-placeholder aspect-square w-full">
    <Dialog.Root bind:open>
        <Dialog.Trigger>
            <button
                class="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors"
            >
                <div class="text-5xl text-gray-400 mb-2">+</div>
                <div class="text-gray-500 font-medium">Add Image</div>
            </button>
        </Dialog.Trigger>

        <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
                <Dialog.Title>Add New Image</Dialog.Title>
            </Dialog.Header>

            <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">
                <div>
                    <label for="imageFile" class="block text-sm font-medium mb-1 text-left">Select Image*</label>

                    <!-- Hidden file input -->
                    <input
                        bind:this={fileInput}
                        type="file"
                        id="imageFile"
                        class="sr-only"
                        accept="image/*"
                        on:change={handleFileChange}
                    />

                    <!-- Custom Drop Zone -->
                    <button
                        type="button"
                        bind:this={dropZone}
                        class="group w-full cursor-pointer p-6 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-center transition-colors {isDragging
                            ? 'bg-gray-100 border-blue-500'
                            : previewUrl
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}"
                        on:click={handleDropZoneClick}
                        on:dragenter={(e) => handleDragEvent(e, true)}
                        on:dragover={(e) => handleDragEvent(e, true)}
                        on:dragleave={(e) => handleDragEvent(e, false)}
                        on:drop={handleDrop}
                    >
                        {#if previewUrl}
                            <div class="mb-2">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    class="max-h-32 max-w-full object-contain mx-auto"
                                />
                            </div>
                            <p class="text-sm text-gray-600">{imageFile?.name || 'Image selected'}</p>
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

                <div>
                    <label class="block text-sm font-medium mb-1 text-left" for="imageTitle">Title</label>
                    <input
                        type="text"
                        id="imageTitle"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                        bind:value={imageTitle}
                        placeholder="Image title"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1 text-left" for="imageAlt">Alt Text</label>
                    <input
                        type="text"
                        id="imageAlt"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                        bind:value={imageAlt}
                        placeholder="Image description for accessibility"
                    />
                </div>

                <Dialog.Footer class="sm:justify-end">
                    <div class="flex space-x-3">
                        <Dialog.Close
                            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer"
                        >
                            Cancel
                        </Dialog.Close>

                        <button
                            type="submit"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                            disabled={!imageFile}
                        >
                            Add Image
                        </button>
                    </div>
                </Dialog.Footer>
            </form>
        </Dialog.Content>
    </Dialog.Root>
</div>
