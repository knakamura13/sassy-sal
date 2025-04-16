<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    // Props
    export let selectedFiles: File[] = [];
    export let previewUrls: string[] = [];

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
            dispatch('filesSelected', Array.from(files));
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
            dispatch('filesSelected', Array.from(files));
        }
    }
</script>

<!-- Hidden file input -->
<input
    bind:this={fileInput}
    type="file"
    id="imageFile"
    class="sr-only"
    accept="image/*"
    multiple
    on:change={handleFileChange}
/>

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
        <div class="mb-2 grid max-h-48 w-full grid-cols-3 gap-2 overflow-y-auto">
            {#each previewUrls.slice(0, 6) as url, index}
                <div class="relative">
                    <img src={url} alt="Preview" class="mx-auto h-20 w-20 rounded object-cover" />
                    {#if index === 0 && previewUrls.length > 6}
                        <div
                            class="absolute inset-0 flex items-center justify-center rounded bg-black bg-opacity-50 font-medium text-white"
                        >
                            +{previewUrls.length - 6} more
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
        <p class="text-sm text-gray-600">
            {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
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
        <p class="font-medium text-gray-600 group-hover:text-blue-600">Drop images here</p>
        <p class="mt-1 text-sm text-gray-500">or click to browse</p>
    {/if}
</button>
