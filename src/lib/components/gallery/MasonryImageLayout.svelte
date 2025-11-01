<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';
    import ImageCard from './ImageCard.svelte';

    // Props
    export let images: Image[] = [];
    export let isAdmin = false;
    export let isCategory = true;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Store aspect ratios and column spans for each image
    let imageLayout: Map<string, { aspectRatio: number; columnSpan: number }> = new Map();

    // Function to handle image click
    function handleImageClick(image: Image) {
        dispatch('imageClick', image);
    }

    // Function to handle image removal
    function handleRemoveImage(imageId: string) {
        dispatch('removeImage', imageId);
    }

    // Function to handle image update
    function handleUpdateImage(event: CustomEvent) {
        dispatch('updateImage', event.detail);
    }

    // Calculate aspect ratio and determine column span for an image
    async function calculateImageLayout(image: Image): Promise<{ aspectRatio: number; columnSpan: number }> {
        // If aspect ratio is already cached, use it
        if (image.aspectRatio !== undefined) {
            const columnSpan = image.aspectRatio >= 1.4 ? 2 : 1;
            return { aspectRatio: image.aspectRatio, columnSpan };
        }

        return new Promise((resolve) => {
            // Use the best available URL for calculating aspect ratio
            const imageUrl = image.fullSizeUrl || image.url;

            if (!imageUrl) {
                resolve({ aspectRatio: 1, columnSpan: 1 });
                return;
            }

            const img = new Image();

            img.onload = () => {
                const aspectRatio = img.width / img.height;
                // Wide landscape images (aspect ratio >= 1.4) span 2 columns
                const columnSpan = aspectRatio >= 1.4 ? 2 : 1;
                resolve({ aspectRatio, columnSpan });
            };

            img.onerror = () => {
                // Default to single column on error
                resolve({ aspectRatio: 1, columnSpan: 1 });
            };

            img.src = imageUrl;
        });
    }

    // Calculate layouts for all images
    async function calculateAllLayouts() {
        const newLayout = new Map();

        for (const image of images) {
            const layout = await calculateImageLayout(image);
            newLayout.set(image.id, layout);
        }

        imageLayout = newLayout;
    }

    // Recalculate layouts when images change
    $: if (images && images.length > 0) {
        calculateAllLayouts();
    }

    // Get column span for a specific image
    function getColumnSpan(imageId: string): number {
        return imageLayout.get(imageId)?.columnSpan || 1;
    }
</script>

<!-- Masonry layout container -->
<div class="masonry-container">
    {#each images as image (image.id)}
        <div
            class="masonry-item"
            style="grid-column: span {getColumnSpan(image.id)};"
            on:click|preventDefault|stopPropagation={() => handleImageClick(image)}
            on:keydown={(e) => e.key === 'Enter' && handleImageClick(image)}
            role="button"
            tabindex="0"
            aria-label={image.title || 'View image'}
        >
            <ImageCard
                {image}
                {isCategory}
                {isAdmin}
                on:remove={() => handleRemoveImage(image.id)}
                on:update={handleUpdateImage}
            />
        </div>
    {/each}
</div>

<style lang="scss">
    .masonry-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
        grid-auto-flow: dense;
        gap: 1rem;
        width: 100%;
        margin: 0 auto;

        /* Responsive grid columns */
        /* Mobile: Single column */
        @media (min-width: 640px) {
            /* Tablet: 2 columns */
            grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 1024px) {
            /* Desktop: 3 columns */
            grid-template-columns: repeat(3, 1fr);
        }
    }

    .masonry-item {
        width: 100%;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        /* Let images maintain their aspect ratio */
        display: flex;
        flex-direction: column;

        /* Ensure images fill the grid cell properly */
        :global(img) {
            width: 100%;
            height: auto;
            display: block;
        }

        &:hover {
            transform: translateY(-2px);
        }
    }
</style>
