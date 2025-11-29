<script lang="ts">
import { createEventDispatcher, tick } from 'svelte';
import type { Image } from '$lib/stores/imageStore';

export let image: Image | null = null;
export let show: boolean = false;

const dispatch = createEventDispatcher();
let modalContainer: HTMLElement;
let closeButton: HTMLButtonElement;
let previouslyFocused: Element | null = null;

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
        if (previouslyFocused instanceof HTMLElement) {
            previouslyFocused.focus();
        }
    }
}

$: if (show) {
    previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null;
    tick().then(() => {
        closeButton?.focus();
    });
}
</script>

{#if show && image}
    <!-- Image Preview Modal -->
    <div
        bind:this={modalContainer}
        class="modal-container fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300 {show
            ? 'opacity-100'
            : 'pointer-events-none opacity-0'}"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        on:click={(e) => e.target === modalContainer && closePreview()}
        on:keydown={(e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                closePreview();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                closeButton?.focus();
            }
        }}
    >
        <button
            bind:this={closeButton}
            class="absolute right-4 top-4 text-2xl text-white transition-all hover:scale-110 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
            on:click={closePreview}
            aria-label="Close preview"
        >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <span
            class="relative h-full max-h-[95vh] w-full max-w-[95vw] overflow-hidden shadow-md transition-transform duration-300 {show
                ? 'scale-100'
                : 'scale-95'}"
        >
            <img src={image.fullSizeUrl} alt={image.alt || 'Image preview'} class="h-full w-full object-contain" />
        </span>
    </div>
{/if}

<style>
    @media (prefers-reduced-motion: reduce) {
        .modal-container {
            transition: none !important;
        }
    }
</style>
