<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    // Props
    export let multiple: boolean = true;
    export let selectedFiles: File[] = [];
    export let previewUrls: string[] = [];
    export let acceptTypes: string = 'image/*';
    export let previewLimit: number = 6;
    export let placeholderText: string = 'Drop files here';
    export let browseText: string = 'or click to browse';
    export let previewClasses: string = 'h-20 w-20 rounded object-cover';
    export let previewWrapperClasses: string = 'grid max-h-48 w-full grid-cols-3 gap-2 overflow-y-auto';

    // State
    let fileInput: HTMLInputElement;
    let dropZone: HTMLElement;
    let isDragging = false;

    const dispatch = createEventDispatcher<{ filesSelected: File[] }>();

    /**
     * Handles file input change event
     */
    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files) {
            const fileArray = Array.from(files);
            dispatch('filesSelected', multiple ? fileArray : [fileArray[0]]);
        }
    }

    /**
     * Triggers file input click when drop zone is clicked
     */
    function handleDropZoneClick() {
        fileInput.click();
    }

    /**
     * Handles drag events (enter, over, leave)
     */
    function handleDragEvent(event: DragEvent, entering: boolean) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = entering;
    }

    /**
     * Handles file drop event
     */
    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            dispatch('filesSelected', multiple ? fileArray : [fileArray[0]]);
        }
    }

    /**
     * Handles paste event
     */
    async function handlePaste(event: ClipboardEvent) {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Try to get files directly from clipboard
        const clipboardItems = event.clipboardData?.items;
        if (!clipboardItems) return;

        const items = Array.from(clipboardItems);
        const imageFiles: File[] = [];

        // Process each clipboard item
        for (const item of items) {
            // Handle images
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
                if (!multiple && imageFiles.length > 0) break; // Stop after first file if multiple is false
            }
            // Handle text (might be an image URL)
            else if (item.type === 'text/plain') {
                try {
                    const text = await new Promise<string>((resolve) => {
                        item.getAsString((str) => resolve(str));
                    });

                    // Check if text is a URL to an image
                    if (/^https?:\/\/.*\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(text)) {
                        try {
                            // Fetch the image
                            const response = await fetch(text);
                            const blob = await response.blob();

                            // Create file from blob
                            const fileName = text.split('/').pop() || 'pasted-image.jpg';
                            const file = new File([blob], fileName, { type: blob.type });
                            imageFiles.push(file);
                            if (!multiple && imageFiles.length > 0) break; // Stop after first file if multiple is false
                        } catch (error) {
                            console.error('Failed to fetch image from URL:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error processing pasted text:', error);
                }
            }
        }

        // If we found image files, dispatch event
        if (imageFiles.length > 0) {
            dispatch('filesSelected', imageFiles);
        }
    }

    // Add paste event listener when component mounts
    onMount(() => {
        // Listen for paste events on the document
        document.addEventListener('paste', handlePaste);

        return () => {
            // Cleanup on component destruction
            document.removeEventListener('paste', handlePaste);
        };
    });
</script>

<!-- Hidden file input -->
<input bind:this={fileInput} type="file" class="sr-only" accept={acceptTypes} {multiple} on:change={handleFileChange} />

<!-- Custom Drop Zone -->
<button
    type="button"
    bind:this={dropZone}
    class="group flex w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors {isDragging
        ? 'border-blue-500 bg-gray-100'
        : previewUrls.length
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}"
    on:click={handleDropZoneClick}
    on:dragenter={(e) => handleDragEvent(e, true)}
    on:dragover={(e) => handleDragEvent(e, true)}
    on:dragleave={(e) => handleDragEvent(e, false)}
    on:drop={handleDrop}
>
    {#if previewUrls.length}
        <div class="mb-2 {previewWrapperClasses}">
            {#each previewUrls.slice(0, previewLimit) as url, index}
                <div class="relative">
                    <img src={url} alt="Preview" class="mx-auto {previewClasses}" />
                    {#if index === 0 && multiple && previewUrls.length > previewLimit}
                        <div
                            class="absolute inset-0 flex items-center justify-center rounded bg-black bg-opacity-50 font-medium text-white"
                        >
                            +{previewUrls.length - previewLimit} more
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
        <p class="text-sm text-gray-600">
            {selectedFiles.length}
            {multiple ? (selectedFiles.length !== 1 ? 'files' : 'file') : 'file'} selected
        </p>
        <p class="mt-1 text-xs text-gray-500">Click to change</p>
    {:else}
        <svg
            class="mb-2 h-10 w-10 text-gray-400 group-hover:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <p class="font-medium text-gray-600 group-hover:text-blue-600">{placeholderText}</p>
        <p class="mt-1 text-sm text-gray-500">{browseText}</p>
    {/if}
</button>
