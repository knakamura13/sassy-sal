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
</script>

<!-- Masonry layout container -->
<div class="masonry-container">
    {#each images as image (image.id)}
        <div
            class="masonry-item"
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
        gap: 1.5rem;
        width: 100%;
        margin: 0 auto;
        justify-content: center;

        /* Responsive grid columns - max 3 columns */
        @media (min-width: 640px) {
            grid-template-columns: repeat(2, minmax(280px, 400px));
            max-width: calc(2 * 400px + 1.5rem);
        }

        @media (min-width: 1024px) {
            grid-template-columns: repeat(3, minmax(300px, 450px));
            max-width: calc(3 * 450px + 2 * 1.5rem);
        }
    }

    .masonry-item {
        width: 100%;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;

        &:hover {
            transform: translateY(-2px);
        }
    }
</style>
