<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { Dialog as BitsDialog } from 'bits-ui';
    import type { Image } from '$lib/stores/imageStore';

    export let image: Image | null = null;
    export let show: boolean = false;

    const dispatch = createEventDispatcher();

    $: dialogOpen = show && !!image;
    $: previewLabel = image
        ? `Full-size preview of ${image.alt || image.title || 'image'}`
        : 'Image preview';
    $: imageAlt =
        image?.alt && image.alt !== 'Gallery image' && image.alt !== 'Image preview'
            ? image.alt
            : image?.title || '';

    onMount(() => {
        return () => {
            document.body.classList.remove('modal-open');
        };
    });

    $: if (typeof document !== 'undefined') {
        if (dialogOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    }

    function handleOpenChange(open: boolean) {
        if (!open && show) {
            dispatch('close');
        }
    }
</script>

<BitsDialog.Root open={dialogOpen} onOpenChange={handleOpenChange} closeOnEscape preventScroll>
    {#if image}
        <BitsDialog.Portal>
            <BitsDialog.Overlay
                class="lightbox-overlay fixed inset-0 z-50 bg-black/85 backdrop-blur-[4px]"
                transition={fade}
                transitionConfig={{ duration: 200 }}
            />
            <BitsDialog.Content
                class="fixed inset-0 z-50 flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none"
            >
                <BitsDialog.Title class="sr-only">{previewLabel}</BitsDialog.Title>
                <BitsDialog.Close
                    class="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:scale-110 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    aria-label="Close preview"
                >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </BitsDialog.Close>

                <span class="relative h-full max-h-[95vh] w-full max-w-[95vw] overflow-hidden shadow-md">
                    <img src={image.fullSizeUrl} alt={imageAlt} class="h-full w-full object-contain" />
                </span>
            </BitsDialog.Content>
        </BitsDialog.Portal>
    {/if}
</BitsDialog.Root>

<style>
    :global(.lightbox-overlay) {
        overscroll-behavior: contain;
    }
</style>
