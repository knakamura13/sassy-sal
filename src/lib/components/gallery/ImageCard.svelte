<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { IMAGE_SIZES } from '$lib/services/imageConfig';
    import type { Image } from '$lib/stores/imageStore';
    import EditImageDialog from './EditImageDialog.svelte';

    export let image: Image;
    export let isAdmin: boolean = false;
    export let isCategory: boolean = false;
    /** LCP candidate: fetchpriority=high + loading=eager */
    export let priority: boolean = false;
    /** Load immediately without marking as the LCP candidate */
    export let eager: boolean = false;
    /** Matches masonry column count; override for 2-col spans */
    export let sizes: string = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

    const dispatch = createEventDispatcher<{
        remove: string;
        update: { id: string; data: any };
        loaded: { id: string };
    }>();

    let placeholderUrl = image.placeholderUrl || '';
    let thumbnailUrl = image.url || '';
    let isFromCache = image.isFromCache || false;

    let responsiveSmallUrl = '';
    let responsiveMediumUrl = '';
    let responsiveLargeUrl = '';

    let responsiveSmallWebp = '';
    let responsiveMediumWebp = '';
    let responsiveLargeWebp = '';

    let responsiveSmallAvif = '';
    let responsiveMediumAvif = '';
    let responsiveLargeAvif = '';

    let editDialogOpen = false;

    $: placeholderUrl = image.placeholderUrl || '';
    $: thumbnailUrl = image.url || '';
    $: isFromCache = image.isFromCache || false;

    $: {
        if (image.responsiveUrls) {
            responsiveSmallUrl = image.responsiveUrls.small || '';
            responsiveMediumUrl = image.responsiveUrls.medium || '';
            responsiveLargeUrl = image.responsiveUrls.large || '';
        }
        if (image.responsiveWebpUrls) {
            responsiveSmallWebp = image.responsiveWebpUrls.small || '';
            responsiveMediumWebp = image.responsiveWebpUrls.medium || '';
            responsiveLargeWebp = image.responsiveWebpUrls.large || '';
        } else {
            responsiveSmallWebp = responsiveSmallUrl;
            responsiveMediumWebp = responsiveMediumUrl;
            responsiveLargeWebp = responsiveLargeUrl;
        }
        if (image.responsiveAvifUrls) {
            responsiveSmallAvif = image.responsiveAvifUrls.small || '';
            responsiveMediumAvif = image.responsiveAvifUrls.medium || '';
            responsiveLargeAvif = image.responsiveAvifUrls.large || '';
        } else {
            responsiveSmallAvif = responsiveSmallUrl;
            responsiveMediumAvif = responsiveMediumUrl;
            responsiveLargeAvif = responsiveLargeUrl;
        }
    }

    $: imageAlt =
        image.alt && image.alt !== 'Gallery image' && image.alt !== 'Loading' && image.alt !== 'Image'
            ? image.alt
            : image.title || '';
    $: aspectStyle = image.aspectRatio ? `aspect-ratio: ${image.aspectRatio}` : '';
    $: intrinsicWidth = image.width ?? IMAGE_SIZES.MEDIUM.width;
    $: intrinsicHeight =
        image.height ?? (image.aspectRatio ? Math.round(intrinsicWidth / image.aspectRatio) : undefined);
    let loadingMode: 'eager' | 'lazy' = 'lazy';
    let fetchPriority: 'high' | 'auto' = 'auto';
    $: loadingMode = priority || eager ? 'eager' : 'lazy';
    $: fetchPriority = priority ? 'high' : 'auto';
    $: displaySrc = thumbnailUrl || placeholderUrl;
    $: showLqip = !priority && !eager && !!placeholderUrl && !!thumbnailUrl && placeholderUrl !== thumbnailUrl;

    function notifyImageLoaded() {
        dispatch('loaded', { id: image.id });
    }

    function handleRemove() {
        dispatch('remove', image.id);
    }

    function handleEdit(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        editDialogOpen = true;
    }

    function handleUpdate(event: CustomEvent<{ id: string; data: any }>) {
        dispatch('update', event.detail);
    }
</script>

<div class="image-card group w-full">
    <div
        class="relative overflow-hidden bg-gray-100 transition-all duration-300 hover:shadow-lg hover:brightness-[1.03]"
        data-has-url={!!displaySrc}
        style={aspectStyle}
    >
        <div class="relative w-full overflow-hidden" style={aspectStyle}>
            {#if isFromCache}
                <div
                    class="absolute right-2 top-2 z-10 rounded-md bg-amber-500 bg-opacity-90 px-2 py-1 text-xs font-medium text-white shadow-md"
                >
                    Processing
                </div>
            {/if}

            {#if displaySrc}
                {#if showLqip}
                    <img
                        src={placeholderUrl}
                        alt=""
                        class="placeholder-blur absolute inset-0 h-full w-full object-cover"
                        aria-hidden="true"
                    />
                {/if}

                <picture>
                    <source
                        media="(max-width: 639px)"
                        srcset={responsiveSmallAvif || responsiveSmallUrl || displaySrc}
                        type="image/avif"
                        {sizes}
                    />
                    <source
                        media="(min-width: 640px) and (max-width: 1023px)"
                        srcset={responsiveMediumAvif || responsiveMediumUrl || displaySrc}
                        type="image/avif"
                        {sizes}
                    />
                    <source
                        media="(min-width: 1024px)"
                        srcset={responsiveLargeAvif || responsiveLargeUrl || displaySrc}
                        type="image/avif"
                        {sizes}
                    />

                    <source
                        media="(max-width: 639px)"
                        srcset={responsiveSmallWebp || responsiveSmallUrl || displaySrc}
                        type="image/webp"
                        {sizes}
                    />
                    <source
                        media="(min-width: 640px) and (max-width: 1023px)"
                        srcset={responsiveMediumWebp || responsiveMediumUrl || displaySrc}
                        type="image/webp"
                        {sizes}
                    />
                    <source
                        media="(min-width: 1024px)"
                        srcset={responsiveLargeWebp || responsiveLargeUrl || displaySrc}
                        type="image/webp"
                        {sizes}
                    />

                    <img
                        src={displaySrc}
                        alt={imageAlt}
                        class={`relative h-full w-full object-cover ${isFromCache ? 'border-2 border-amber-400' : ''}`}
                        style={aspectStyle}
                        width={intrinsicWidth}
                        height={intrinsicHeight}
                        {sizes}
                        loading={loadingMode}
                        fetchpriority={fetchPriority}
                        decoding="async"
                        on:load={notifyImageLoaded}
                    />
                </picture>
            {:else}
                <div
                    class="flex min-h-[200px] w-full items-center justify-center bg-gray-100 {isFromCache
                        ? 'border-2 border-amber-400'
                        : ''}"
                >
                    <div class="text-gray-400">Image unavailable</div>
                </div>
            {/if}

            {#if isAdmin}
                <div class="absolute right-0 top-0 z-10 flex space-x-1 bg-gray-900 bg-opacity-60 p-1 shadow-lg">
                    <button
                        type="button"
                        class="aspect-square h-10 w-10 p-1 text-white hover:bg-gray-600"
                        on:click|stopPropagation={handleEdit}
                        aria-label="Edit image"
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        class="aspect-square h-10 w-10 p-1 text-white hover:bg-red-600"
                        on:click|stopPropagation={handleRemove}
                        aria-label="Remove image"
                    >
                        ×
                    </button>
                </div>
            {/if}
        </div>

        {#if image.title && !isCategory && displaySrc}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm font-medium md:text-base">{image.title}</h3>
            </div>
        {/if}
    </div>
</div>

<EditImageDialog bind:open={editDialogOpen} {image} currentDisplayedUrl={displaySrc} on:update={handleUpdate} />

<style>
    .placeholder-blur {
        filter: blur(16px);
        transform-origin: center;
    }
</style>
