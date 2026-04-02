<script lang="ts">
import { createEventDispatcher, tick, onMount } from 'svelte';
import type { Image } from '$lib/stores/imageStore';

export let image: Image | null = null;
export let show: boolean = false;

const dispatch = createEventDispatcher();
let modalContainer: HTMLElement;
let closeButton: HTMLButtonElement;
let previouslyFocused: Element | null = null;
let isVisible = false; // controls CSS transition state
let isRendered = false; // controls DOM presence
let cleanupTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Cleanup on unmount: restore body scroll and cancel pending timeouts
onMount(() => {
    return () => {
        document.body.classList.remove('modal-open');
        if (cleanupTimeoutId) {
            clearTimeout(cleanupTimeoutId);
            cleanupTimeoutId = null;
        }
    };
});

// Two-phase show: render first, then trigger CSS transition on next frame
$: if (show && image) {
    // Cancel any pending cleanup from a previous close
    if (cleanupTimeoutId) {
        clearTimeout(cleanupTimeoutId);
        cleanupTimeoutId = null;
    }
    isRendered = true;
    previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null;
    // Wait for DOM render, then trigger transition
    tick().then(() => {
        requestAnimationFrame(() => {
            isVisible = true;
            closeButton?.focus();
        });
    });
} else if (!show && isRendered) {
    isVisible = false;
    // Wait for exit transition, then remove from DOM
    cleanupTimeoutId = setTimeout(() => {
        cleanupTimeoutId = null;
        isRendered = false;
        if (previouslyFocused instanceof HTMLElement) {
            previouslyFocused.focus();
        }
    }, 300);
}

// Function to close the preview
function closePreview() {
    isVisible = false;
    dispatch('close');
    // Restore focus after transition completes
    cleanupTimeoutId = setTimeout(() => {
        cleanupTimeoutId = null;
        isRendered = false;
        if (previouslyFocused instanceof HTMLElement) {
            previouslyFocused.focus();
        }
    }, 300);
}

function handleKeydown(e: KeyboardEvent) {
    if (!show) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        closePreview();
    }
    // Focus trap: keep focus within the modal
    if (e.key === 'Tab') {
        e.preventDefault();
        closeButton?.focus();
    }
}

// Lock body scroll when modal is open (uses CSS class to override !important in layout)
$: if (typeof document !== 'undefined') {
    if (isVisible) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isRendered && image}
    <!-- Image Preview Modal -->
    <div
        bind:this={modalContainer}
        class="modal-container fixed inset-0 z-50 flex items-center justify-center"
        class:modal-container--visible={isVisible}
        role="dialog"
        aria-modal="true"
        aria-label="Full-size preview of {image.alt || image.title || 'image'}"
        tabindex="-1"
    >
        <button
            class="modal-backdrop absolute inset-0 z-0 h-full w-full cursor-pointer border-0 bg-transparent"
            type="button"
            aria-hidden="true"
            tabindex="-1"
            on:click={closePreview}
        ></button>

        <div class="modal-content relative z-10 flex items-center justify-center">
            <button
                bind:this={closeButton}
                class="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-2 text-white transition-all hover:scale-110 hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                on:click={closePreview}
                aria-label="Close preview"
                type="button"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <span class="modal-image relative h-full max-h-[95vh] w-full max-w-[95vw] overflow-hidden shadow-md">
                <img src={image.fullSizeUrl} alt={image.alt || 'Image preview'} class="h-full w-full object-contain" />
            </span>
        </div>
    </div>
{/if}

<style>
    .modal-container {
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
        transition: background 0.3s ease, backdrop-filter 0.3s ease;
        pointer-events: none;
    }

    .modal-container--visible {
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(4px);
        pointer-events: auto;
    }

    .modal-content {
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .modal-container--visible .modal-content {
        opacity: 1;
    }

    .modal-image {
        transform: scale(0.95);
        transition: transform 0.3s ease;
    }

    .modal-container--visible .modal-image {
        transform: scale(1);
    }

    @media (prefers-reduced-motion: reduce) {
        .modal-container,
        .modal-content,
        .modal-image {
            transition: none !important;
        }
    }
</style>
