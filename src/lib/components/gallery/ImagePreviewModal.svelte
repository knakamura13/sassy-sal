<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';
    import ImagePreview from './ImagePreview.svelte';

    // Props
    export let image: Image | null = null;
    export let show = false;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Handle keyboard events for preview
    function handleKeydown(e: KeyboardEvent) {
        if (show && (e.key === 'Escape' || e.key === 'Enter')) {
            e.preventDefault();
            e.stopPropagation();
            closePreview();
        }
    }

    // Handle preview close
    function closePreview() {
        dispatch('close');
    }

    // Handle image click for preview
    export function openPreview(imageToPreview: Image) {
        dispatch('open', imageToPreview);
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<ImagePreview {image} {show} on:close={closePreview} />
