<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    import { showToast } from '$lib/utils';
    import CategoryDialog from './CategoryDialog.svelte';

    // Define Sanity Category type locally
    interface SanityCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            password?: string;
            thumbnail?: {
                data?: {
                    attributes?: {
                        url?: string;
                        placeholderUrl?: string;
                        thumbnailUrl?: string;
                        fullSizeUrl?: string;
                        width?: number;
                        height?: number;
                    };
                };
            };
        };
    }

    export let category: SanityCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
        update: { id: string | number; data: any };
    }>();

    // State for image URLs
    let placeholderUrl = '';
    let thumbnailUrl = '';
    let fullSizeUrl = '';
    let currentDisplayedUrl = '';

    // Loading states
    let isLoading = true;
    let thumbnailLoaded = false;
    let fullSizeLoaded = false;

    // Edit dialog state
    let editDialogOpen = false;

    // Ensure we have default values for missing properties
    $: categoryId = category?.id || 'placeholder';
    $: categoryName = category?.attributes?.name || 'Missing Category';
    $: categoryOrder = category?.attributes?.order ?? 0;
    $: categoryThumbnail = category?.attributes?.thumbnail;

    // Progressive loading logic
    $: {
        // Extract URLs from the category data
        if (categoryThumbnail?.data?.attributes) {
            const attrs = categoryThumbnail.data.attributes;
            placeholderUrl = attrs.placeholderUrl || '';
            thumbnailUrl = attrs.url || '';
            fullSizeUrl = attrs.fullSizeUrl || attrs.url || '';
        }

        // Set initial display URL to placeholder if available
        if (placeholderUrl && !currentDisplayedUrl) {
            currentDisplayedUrl = placeholderUrl;
        }
    }

    onMount(async () => {
        await loadImage();
    });

    // Function to load image in progressive stages
    async function loadImage() {
        isLoading = true;

        try {
            if (!categoryThumbnail) {
                usePlaceholderBackground();
                return;
            }

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
                        usePlaceholderBackground();
                    }
                }
            } else {
                usePlaceholderBackground();
            }

            isLoading = false;
        } catch (error) {
            console.error('Error in progressive image loading:', error);
            usePlaceholderBackground();
        }
    }

    // Helper to use placeholder background when no image is available
    function usePlaceholderBackground() {
        // Set currentDisplayedUrl to empty string to trigger placeholder background display
        currentDisplayedUrl = '';
        isLoading = false;
    }

    function handleRemove(e: Event) {
        e.preventDefault();
        dispatch('remove', categoryId);
    }

    function handleEdit(e: Event) {
        e.preventDefault();
        editDialogOpen = true;
    }

    function handleUpdate(event: CustomEvent<{ id: string | number; data: any }>) {
        dispatch('update', event.detail);

        // Force a reload of the image when a new one is uploaded
        if (event.detail.data.data.thumbnail) {
            setTimeout(async () => {
                try {
                    await loadImage();
                } catch (reloadError) {
                    // Silent failure - image will use placeholder if needed
                }
            }, 1500);
        }

        // Update local state to reflect changes (via reactive declarations)
        if (category && category.attributes && event.detail.data.data) {
            const data = event.detail.data.data;
            if (data.name) {
                category.attributes.name = data.name;
            }
            if (typeof data.order === 'number') {
                category.attributes.order = data.order;
            }
        }
    }
</script>

<a
    href={String(categoryId).startsWith('temp-') ? '#' : isAdmin ? `/${categoryName}?admin=true` : `/${categoryName}`}
    class="category-card group relative block h-full w-full overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
    class:pointer-events-none={String(categoryId).startsWith('temp-')}
>
    <div
        class="category-card-border pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
    ></div>
    <div class="relative h-full w-full">
        {#if String(categoryId).startsWith('temp-')}
            <div class="absolute left-0 right-0 top-0 z-10 bg-blue-600 px-2 py-1 text-center text-xs text-white">
                Saving...
            </div>
        {/if}
        {#if !isLoading}
            {#if currentDisplayedUrl}
                <div class="h-full w-full">
                    <img
                        src={currentDisplayedUrl}
                        alt={categoryName}
                        class="h-full w-full object-cover transition-opacity duration-500"
                        style="opacity: 1;"
                    />
                </div>
            {:else}
                <!-- Placeholder pattern when no image is available -->
                <div
                    class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200"
                >
                    <div class="text-center text-gray-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="mx-auto h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p class="mt-2 text-xs">No image</p>
                    </div>
                </div>
            {/if}
        {:else}
            <!-- Loading placeholder - smaller version of the image without blur -->
            <div class="flex h-full w-full items-center justify-center bg-gray-100">
                {#if placeholderUrl}
                    <img src={placeholderUrl} alt="Loading" class="h-full w-full object-cover" />
                {:else}
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                {/if}
            </div>
        {/if}

        <!-- Password protection indicator -->
        {#if category.attributes.password && !isAdmin}
            <div class="absolute left-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
            </div>
        {/if}

        <!-- Category name -->
        <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4 text-white transition-opacity duration-300 group-hover:opacity-0"
        >
            <h2 class="text-right text-2xl font-medium tracking-wide">
                {categoryName}
                {#if category.attributes.password && !isAdmin}
                    <span class="ml-2 text-lg">🔒</span>
                {/if}
            </h2>
        </div>

        <!-- Admin Controls Overlay -->
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
</a>

<!-- Edit Dialog -->
<CategoryDialog bind:open={editDialogOpen} mode="edit" {category} {currentDisplayedUrl} on:update={handleUpdate} />
