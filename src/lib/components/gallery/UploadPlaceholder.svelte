<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import type { Image } from '$lib/stores/imageStore';

    // Add categoryId as a prop to support category galleries
    export let categoryId: string = '';

    const dispatch = createEventDispatcher<{ addImages: Image[] }>();

    let showForm = false;
    let imageTitle = '';
    let imageAlt = '';
    let imageUrl = '';
    let modalContainer: HTMLElement;

    function resetForm() {
        closeModal();
        imageTitle = '';
        imageAlt = '';
        imageUrl = '';
    }

    async function closeModal() {
        showForm = false;
        await tick();
        // Wait for the transition to complete
        if (modalContainer) {
            await new Promise((resolve) => {
                const handleTransitionEnd = () => {
                    modalContainer.removeEventListener('transitionend', handleTransitionEnd);
                    resolve(undefined);
                };
                modalContainer.addEventListener('transitionend', handleTransitionEnd);
            });
        }
    }

    function handleSubmit() {
        if (!imageUrl.trim()) {
            alert('Please enter an image URL');
            return;
        }

        // Create a new image object
        const newImage: Image = {
            id: uuidv4(),
            url: imageUrl.trim(),
            alt: imageAlt.trim() || 'Image description',
            title: imageTitle.trim() || undefined,
            categoryId: categoryId || '1' // Default to first category if not specified
        };

        dispatch('addImages', [newImage]);
        resetForm();
    }
</script>

<svelte:window
    on:keydown={(e) => {
        if (showForm && (e.key === 'Escape' || (e.key === 'Enter' && e.ctrlKey))) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        }
    }}
/>

<div class="upload-placeholder aspect-square w-full">
    <button
        class="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors"
        on:click={() => (showForm = true)}
    >
        <div class="text-5xl text-gray-400 mb-2">+</div>
        <div class="text-gray-500 font-medium">Add Image</div>
    </button>
</div>

{#if showForm}
    <!-- Modal Form -->
    <button
        bind:this={modalContainer}
        type="button"
        class="modal-container fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 {showForm
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'}"
        on:click={closeModal}
        aria-label="Close modal overlay"
    >
        <div
            class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transition-transform duration-300 {showForm
                ? 'scale-100'
                : 'scale-95'}"
            role="dialog"
            aria-modal="true"
            on:click|stopPropagation={() => {}}
        >
            <button
                class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none transition-all hover:scale-110"
                on:click={closeModal}
                aria-label="Close form"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <h3 class="text-xl font-semibold mb-4">Add New Image</h3>

            <div class="mb-4">
                <label class="block text-sm font-medium mb-1" for="imageUrl">Image URL*</label>
                <input
                    type="text"
                    id="imageUrl"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={imageUrl}
                    placeholder="https://example.com/image.jpg"
                    required
                />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium mb-1" for="imageTitle">Title</label>
                <input
                    type="text"
                    id="imageTitle"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={imageTitle}
                    placeholder="Image title (optional)"
                />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium mb-1" for="imageAlt">Alt Text</label>
                <input
                    type="text"
                    id="imageAlt"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={imageAlt}
                    placeholder="Image description for accessibility"
                />
            </div>

            <div class="flex space-x-3 mt-6">
                <button
                    class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    on:click={handleSubmit}
                >
                    Add Image
                </button>
                <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded" on:click={resetForm}>
                    Cancel
                </button>
            </div>
        </div>
    </button>
{/if}
