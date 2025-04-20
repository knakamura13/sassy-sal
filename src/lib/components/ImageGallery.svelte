<script lang="ts">
    import { onMount } from 'svelte';
    import ResponsiveImage from './ResponsiveImage.svelte';

    export let images: Array<{
        id: string;
        attributes: {
            image: {
                data: {
                    attributes: {
                        url: string;
                        placeholderSrc?: string;
                        responsive?: {
                            small: string;
                            medium: string;
                            large: string;
                        };
                    };
                };
            };
        };
    }> = [];

    let visibleImages: string[] = [];
    let scrollY: number;
    let innerHeight: number;
    let imageRefs: HTMLElement[] = [];
    let imagePriorities: Record<string, boolean> = {};

    // Prioritize first 4 images for immediate loading
    onMount(() => {
        images.slice(0, 4).forEach((image) => {
            imagePriorities[image.id] = true;
        });
    });
</script>

<svelte:window bind:scrollY bind:innerHeight />

<div class="gallery-grid">
    {#each images as image, i (image.id)}
        <div class="gallery-item" bind:this={imageRefs[i]}>
            <ResponsiveImage
                src={image.attributes.image.data.attributes.url}
                placeholderSrc={image.attributes.image.data.attributes.placeholderSrc}
                responsive={image.attributes.image.data.attributes.responsive}
                alt=""
                priority={imagePriorities[image.id] || false}
                className="gallery-image"
            />
        </div>
    {/each}
</div>

<style>
    .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-gap: 1rem;
        margin: 2rem 0;
    }

    .gallery-item {
        overflow: hidden;
        border-radius: 0.5rem;
        aspect-ratio: 1 / 1;
        background-color: #f0f0f0;
    }

    @media (max-width: 768px) {
        .gallery-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }
    }

    @media (max-width: 480px) {
        .gallery-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
