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
    export let columns = 3; // Current number of columns (1, 2, or 3)

    let gridEl: HTMLDivElement | null = null;
    let msnry: any = null; // Masonry instance
    let il: any = null; // imagesLoaded instance
    let itemRefs: HTMLElement[] = [];

    // Decide which items should be wide (2 columns) - based on admin-controlled boolean
    const isWide = (img: Image) => {
        // Never make images wide in 1-column mode
        if (columns === 1) {
            return false;
        }

        // Use the admin-controlled boolean field
        return img.spanTwoColumns === true;
    };

    function relayout() {
        msnry?.layout();
    }

    let relayoutFrame: number | null = null;
    function scheduleRelayout() {
        if (!browser) return;

        if (relayoutFrame !== null) {
            cancelAnimationFrame(relayoutFrame);
        }

        relayoutFrame = requestAnimationFrame(() => {
            relayout();
            relayoutFrame = null;
        });
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
            il.on('progress', scheduleRelayout);

            // Relayout on resize
            ro = new ResizeObserver(() => relayout());
            ro.observe(gridEl);
        })();

        // Return cleanup function
        return () => {
            ro?.disconnect();
            il?.off('progress', scheduleRelayout);
            msnry?.destroy();
            msnry = null;
        };
    });

    // When the images array changes, ping Masonry after the DOM updates on next tick
    $: images, setTimeout(() => relayout(), 0);

    function handleImageClick(image: Image) {
        dispatch('imageClick', image);
    }

    function handleKeydown(event: KeyboardEvent, index: number, image: Image) {
        const key = event.key;
        const lastIndex = itemRefs.length - 1;

        if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            handleImageClick(image);
            return;
        }

        if (key === 'ArrowRight' || key === 'ArrowDown') {
            event.preventDefault();
            const nextIndex = Math.min(index + 1, lastIndex);
            itemRefs[nextIndex]?.focus();
        }

        if (key === 'ArrowLeft' || key === 'ArrowUp') {
            event.preventDefault();
            const prevIndex = Math.max(index - 1, 0);
            itemRefs[prevIndex]?.focus();
        }
    }

    function handleImageUpdate(event: CustomEvent) {
        dispatch('updateImage', event.detail);
    }

    function handleImageRemove(event: CustomEvent) {
        dispatch('removeImage', event.detail);
    }
</script>

<!-- Masonry grid -->
<div class="grid" bind:this={gridEl}>
    <!-- Sizer defines the base column width; CSS controls how many columns per breakpoint -->
    <div class="grid-sizer"></div>

    {#each images as image, index (image.id)}
        <div
            class={`grid-item ${isWide(image) ? 'w2' : ''}`}
            bind:this={(el) => (itemRefs[index] = el)}
            on:click|stopPropagation={() => handleImageClick(image)}
            on:keydown={(e) => handleKeydown(e, index, image)}
            role="button"
            tabindex="0"
            aria-label={image.title || 'View image'}
        >
            <!-- Your card component; ensure it renders a single <img> inside -->
            <ImageCard
                {image}
                {isCategory}
                {isAdmin}
                on:loaded={scheduleRelayout}
                on:update={handleImageUpdate}
                on:remove={handleImageRemove}
            />
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

    .grid-item:focus-visible {
        outline: 3px solid #d19177;
        outline-offset: 4px;
    }

    @media (prefers-reduced-motion: reduce) {
        .grid-item,
        .grid-sizer {
            transition: none !important;
        }
    }
</style>
