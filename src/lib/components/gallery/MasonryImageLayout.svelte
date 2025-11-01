<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
    import type { Image } from '$lib/stores/imageStore';
    import ImageCard from './ImageCard.svelte';

    // imagesLoaded doesn't have TypeScript definitions, so we use any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Events
    const dispatch = createEventDispatcher();

    export let images: Image[] = [];
    export let isAdmin = false;
    export let isCategory = true;

    let gridEl: HTMLDivElement | null = null;
    let msnry: any = null; // Masonry instance
    let il: any = null; // imagesLoaded instance

    // Masonry layout constants
    const WIDE_ASPECT_RATIO_THRESHOLD = 1.4; // Images with aspect ratio >= this are considered wide
    const MIN_IMAGES_REMAINING_FOR_WIDE = 3; // Don't make images wide if fewer than this many images remain
    const SKIP_FIRST_N_WIDE_IMAGES = 1; // Skip the first N wide images (slice parameter)
    const WIDE_IMAGE_FREQUENCY = 3; // Show every Nth wide image as actually wide (2-column span)

    // Decide which items should be wide (2 columns) - selective display to prevent whitespace
    const isWide = (img: Image) => {
        const ar = img.aspectRatio ?? 1;
        const isWideAspectRatio = ar >= WIDE_ASPECT_RATIO_THRESHOLD;

        if (!isWideAspectRatio) {
            return false;
        }

        // Find this image's position in the full images array
        const currentImageIndex = images.findIndex((image) => image.id === img.id);
        const imagesRemaining = images.length - currentImageIndex - 1;

        // Don't make images wide if there are fewer than MIN_IMAGES_REMAINING_FOR_WIDE images remaining
        // This prevents whitespace issues when wide images appear near the end
        if (imagesRemaining < MIN_IMAGES_REMAINING_FOR_WIDE) {
            return false;
        }

        // Find this image's position among all wide images, skipping the first one
        const wideImages = images
            .filter((img) => (img.aspectRatio ?? 1) >= WIDE_ASPECT_RATIO_THRESHOLD)
            .slice(SKIP_FIRST_N_WIDE_IMAGES);
        const wideImageIndex = wideImages.findIndex((wideImg) => wideImg.id === img.id);
        const shouldBeWide = wideImageIndex % WIDE_IMAGE_FREQUENCY === 0; // Every Nth wide image

        return shouldBeWide;
    };

    function relayout() {
        msnry?.layout();
    }

    onMount(() => {
        if (!browser || !gridEl) return;

        let ro: ResizeObserver | null = null;

        // Dynamically import masonry libraries only on client side
        (async () => {
            const [Masonry, imagesLoaded] = await Promise.all([
                import('masonry-layout'),
                // @ts-ignore - imagesloaded doesn't have TypeScript definitions
                import('imagesloaded')
            ]);

            // Masonry instance
            msnry = new Masonry.default(gridEl, {
                itemSelector: '.grid-item',
                columnWidth: '.grid-sizer', // responsive via CSS below
                gutter: 16, // horizontal and vertical spacing
                transitionDuration: 0 // snappy; set e.g. '150ms' if you want animated reflows
            });

            // Layout after each image loads
            il = imagesLoaded.default(gridEl);
            il.on('progress', () => msnry?.layout());

            // Relayout on resize
            ro = new ResizeObserver(() => relayout());
            ro.observe(gridEl);
        })();

        // Return cleanup function
        return () => {
            ro?.disconnect();
            il?.off('progress');
            msnry?.destroy();
            msnry = null;
        };
    });

    // When the images array changes, ping Masonry after the DOM updates on next tick
    $: images, setTimeout(() => relayout(), 0);

    function handleImageClick(image: Image) {
        dispatch('imageClick', image);
    }
</script>

<!-- Masonry grid -->
<div class="grid" bind:this={gridEl}>
    <!-- Sizer defines the base column width; CSS controls how many columns per breakpoint -->
    <div class="grid-sizer"></div>

    {#each images as image (image.id)}
        <div
            class={`grid-item ${isWide(image) ? 'w2' : ''}`}
            on:click|stopPropagation={() => handleImageClick(image)}
            on:keydown={(e) => e.key === 'Enter' && handleImageClick(image)}
            role="button"
            tabindex="0"
            aria-label={image.title || 'View image'}
        >
            <!-- Your card component; ensure it renders a single <img> inside -->
            <ImageCard {image} {isCategory} {isAdmin} />
        </div>
    {/each}
</div>

<style lang="scss">
    /* Set how many columns at each breakpoint with a CSS variable.
     Masonry uses the .grid-sizer width as the column width. */
    .grid {
        --cols: 1;
        width: 100%;
        max-width: 1400px; /* full width utilization at all breakpoints */
        margin: 0 auto;
    }

    @media (min-width: 640px) {
        .grid {
            --cols: 2;
        }
    }

    @media (min-width: 1024px) {
        .grid {
            --cols: 3;
            max-width: 1400px; /* ensure full width utilization on desktop */
        }
    }
    /* Responsive column sizing that adapts to available space */
    .grid-sizer,
    .grid-item {
        /* Fluid width: account for gutters in calculation */
        width: calc((100% - calc(16px * (var(--cols) - 1))) / var(--cols));
        margin-bottom: 16px;
    }

    /* Wide items span 2 columns */
    .grid-item.w2 {
        width: calc(
            2 * ((100% - calc(16px * (var(--cols) - 1))) / var(--cols)) + 16px
        ); /* 2 * column_width + 1 gutter (between the spanned columns) */
    }

    /* Make images fill their tile width without stretching height.
     Masonry handles the variable height automatically. */
    .grid-item :global(img) {
        display: block;
        width: 100%;
        height: auto;
    }

    /* Optional hover affordance */
    .grid-item {
        cursor: pointer;
    }
</style>
