<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    import type { Image } from '$lib/stores/imageStore';
    import EditImageDialog from './EditImageDialog.svelte';

    export let image: Image;
    export let isAdmin: boolean = false;
    export let isCategory: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string;
        update: { id: string; data: any };
        loaded: { id: string };
    }>();

    // Image loading states
    let isLoading = true;
    let placeholderUrl = image.placeholderUrl || '';
    let thumbnailUrl = image.url || '';
    let fullSizeUrl = image.fullSizeUrl || image.url || '';
    let currentDisplayedUrl = '';
    let thumbnailLoaded = false;
    let fullSizeLoaded = false;
    let isFromCache = image.isFromCache || false; // Track if image is from local cache

    // Responsive image URLs
    let responsiveSmallUrl = '';
    let responsiveMediumUrl = '';
    let responsiveLargeUrl = '';

    // Edit dialog state
    let editDialogOpen = false;

    // Set initial URL to placeholder if available
    $: {
        if (placeholderUrl && !currentDisplayedUrl) {
            currentDisplayedUrl = placeholderUrl;
        }
    }

    // When responsive URLs are available in the image, use them
    $: {
        if (image.responsiveUrls) {
            responsiveSmallUrl = image.responsiveUrls.small || '';
            responsiveMediumUrl = image.responsiveUrls.medium || '';
            responsiveLargeUrl = image.responsiveUrls.large || '';
        }
    }

    // Watch for changes to the image URL (e.g. when transitioning from blob to CDN URL)
    $: if (image.url && image.url !== thumbnailUrl) {
        // Update URLs
        placeholderUrl = image.placeholderUrl || '';
        thumbnailUrl = image.url;
        fullSizeUrl = image.fullSizeUrl || image.url;

        // Reset loading state and rerun progressive loading
        isLoading = true;
        thumbnailLoaded = false;
        fullSizeLoaded = false;
        loadImage();
    }

    onMount(async () => {
        await loadImage();
    });

    function notifyImageLoaded() {
        dispatch('loaded', { id: image.id });
    }

    $: isPlaceholderActive = !!placeholderUrl && currentDisplayedUrl === placeholderUrl;

    // Function to load image in progressive stages
    async function loadImage() {
        isLoading = true;

        try {
            // Start with placeholder if available
            if (placeholderUrl) {
                currentDisplayedUrl = placeholderUrl;
            }

            // Function to preload an image and return a promise
            const preloadImage = (url: string): Promise<void> => {
                return new Promise((resolve, reject) => {
                    if (!url) {
                        reject(new Error('No URL provided'));
                        return;
                    }

                    const img = new Image();
                    const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), 7000);

                    img.onload = () => {
                        clearTimeout(timeoutId);
                        resolve();
                    };

                    img.onerror = () => {
                        clearTimeout(timeoutId);
                        reject(new Error('Failed to load image'));
                    };

                    img.src = url;
                });
            };

            // Load thumbnail
            if (thumbnailUrl) {
                try {
                    await preloadImage(thumbnailUrl);
                    currentDisplayedUrl = thumbnailUrl;
                    thumbnailLoaded = true;

                    // Start loading full-size image after thumbnail is displayed
                    if (fullSizeUrl && fullSizeUrl !== thumbnailUrl) {
                        preloadImage(fullSizeUrl)
                            .then(() => {
                                currentDisplayedUrl = fullSizeUrl;
                                fullSizeLoaded = true;
                            })
                            .catch((err) => {
                                console.warn('Failed to load full-size image:', err);
                                // Keep using thumbnail if full-size fails
                            });
                    } else {
                        fullSizeLoaded = true; // Mark as loaded if no separate full-size URL
                    }
                } catch (error) {
                    console.warn('Failed to load thumbnail:', error);
                    // If thumbnail fails but we have a placeholder, keep using placeholder
                    if (!placeholderUrl) {
                        useEmptyPlaceholder();
                    }
                }
            } else {
                useEmptyPlaceholder();
            }

            isLoading = false;
        } catch (error) {
            console.error('Error in progressive image loading:', error);
            useEmptyPlaceholder();
        }
    }

    // Helper for when no image is available
    function useEmptyPlaceholder() {
        currentDisplayedUrl = '';
        isLoading = false;
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
        class="relative overflow-hidden bg-gray-100 transition-all duration-300 hover:shadow-lg"
        data-has-url={!!currentDisplayedUrl}
    >
        <!-- Image with progressive loading -->
        <div class="relative w-full overflow-hidden">
            {#if isFromCache}
                <div
                    class="absolute right-2 top-2 z-10 rounded-md bg-amber-500 bg-opacity-90 px-2 py-1 text-xs font-medium text-white shadow-md"
                >
                    Processing
                </div>
            {/if}

            {#if isLoading}
                <!-- Loading state with placeholder -->
                <div class="flex h-full w-full items-center justify-center bg-gray-100">
                    {#if placeholderUrl}
                        <img
                            src={placeholderUrl}
                            alt="Loading"
                            class="h-full w-full object-cover {isFromCache ? 'border-2 border-amber-400' : ''} placeholder-blur"
                        />
                    {:else}
                        <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                    {/if}
                </div>
            {:else if currentDisplayedUrl}
                <!-- Responsive image with picture element and srcset -->
                <picture>
                    <!-- For small devices like phones (width < 640px) -->
                    <source
                        media="(max-width: 639px)"
                        srcset={responsiveSmallUrl || currentDisplayedUrl}
                        type="image/webp"
                    />

                    <!-- For medium devices like tablets (640px <= width < 1024px) -->
                    <source
                        media="(min-width: 640px) and (max-width: 1023px)"
                        srcset={responsiveMediumUrl || currentDisplayedUrl}
                        type="image/webp"
                    />

                    <!-- For large devices like desktops (width >= 1024px) -->
                    <source
                        media="(min-width: 1024px)"
                        srcset={responsiveLargeUrl || currentDisplayedUrl}
                        type="image/webp"
                    />

                    <!-- Fallback image for browsers that don't support picture/srcset -->
                    <img
                        src={currentDisplayedUrl}
                        alt={image.alt || 'Gallery image'}
                        class={`h-full w-full object-cover transition-opacity duration-500 ${isFromCache ? 'border-2 border-amber-400' : ''} ${isPlaceholderActive ? 'placeholder-blur' : ''}`}
                        style="opacity: 1;"
                        loading="lazy"
                        on:load={() => {
                            thumbnailLoaded = true;
                            isLoading = false;
                            notifyImageLoaded();
                        }}
                    />
                </picture>
            {:else}
                <!-- Fallback when no image is available -->
                <div
                    class="flex min-h-[200px] w-full items-center justify-center bg-gray-100 {isFromCache
                        ? 'border-2 border-amber-400'
                        : ''}"
                >
                    <div class="text-gray-400">Image loading...</div>
                </div>
            {/if}

            {#if isAdmin}
                <div class="absolute right-0 top-0 z-10 flex space-x-1 bg-gray-900 bg-opacity-60 p-1 shadow-lg">
                    <button
                        type="button"
                        class="aspect-square h-10 w-10 p-1 text-white hover:bg-gray-600"
                        on:click|stopPropagation={handleEdit}
                        aria-label="Edit category"
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        class="aspect-square h-10 w-10 p-1 text-white hover:bg-red-600"
                        on:click|stopPropagation={handleRemove}
                        aria-label="Remove category"
                    >
                        ×
                    </button>
                </div>
            {/if}
        </div>

        {#if image.title && !isCategory && currentDisplayedUrl}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm font-medium md:text-base">{image.title}</h3>
            </div>
        {/if}
    </div>
</div>

<!-- Edit Image Dialog -->
<EditImageDialog bind:open={editDialogOpen} {image} {currentDisplayedUrl} on:update={handleUpdate} />

<style>
    /* Blur-up tiny placeholder so it fills space without showing pixelation */
    .placeholder-blur {
        filter: blur(16px);
        transform: scale(1.06);
        transform-origin: center;
        transition: filter 200ms ease, transform 200ms ease;
    }
</style>
