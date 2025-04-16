<script lang="ts">
    import { createEventDispatcher, tick } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';

    export let image: Image | null = null;
    export let show: boolean = false;

    const dispatch = createEventDispatcher();
    let modalContainer: HTMLElement;

    // Function to close the preview
    async function closePreview() {
        show = false;
        dispatch('close');
        await tick();
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
</script>

{#if show && image}
    <!-- Image Preview Modal -->
    <button
        bind:this={modalContainer}
        type="button"
        class="modal-container fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 {show
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'}"
        on:click={closePreview}
        aria-label="Close modal overlay"
    >
        <button
            class="absolute right-4 top-4 text-2xl text-white transition-all hover:scale-110 hover:text-gray-300 focus:outline-none"
            on:click={closePreview}
            aria-label="Close preview"
        >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div
            class="relative h-full max-h-[95vh] w-full max-w-[95vw] overflow-hidden shadow-md transition-transform duration-300 {show
                ? 'scale-100'
                : 'scale-95'}"
            role="dialog"
            aria-modal="true"
        >
            <img src={image.url} alt={image.alt || 'Image preview'} class="h-full w-full object-contain" />
        </div>
    </button>
{/if}
