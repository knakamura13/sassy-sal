<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { getRandomImageByQuery } from '$lib/services/unsplash';
    import { STRAPI_API_URL } from '$lib/services/strapi';

    // Define Strapi Category type locally
    interface StrapiCategory {
        id: string | number;
        attributes: {
            name: string;
            slug: string;
            description?: string;
            thumbnail?: any; // Using any type to handle various Strapi response structures
        };
    }

    export let category: StrapiCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
    }>();

    // State for image URL (will be populated from Unsplash if missing)
    let imageUrl = '';
    let isLoading = true;

    // Make sure category has the expected structure to prevent errors
    if (!category) {
        console.error(`Category is undefined!`);
        category = {
            id: 'placeholder',
            attributes: {
                name: 'Missing Category',
                slug: 'missing-category'
            }
        };
    } else if (!category.attributes) {
        console.error(`Category is missing attributes`);
        category.attributes = {
            name: (category as any).name || 'Unknown Category',
            slug: (category as any).slug || 'unknown-category'
        };
    }

    onMount(async () => {
        await loadImage();
    });

    // Function to load image from thumbnail or Unsplash
    async function loadImage() {
        isLoading = true;

        // Check if the category has a thumbnail property
        if (category.attributes.thumbnail) {
            // Handle different possible structures for thumbnail data from Strapi
            let thumbnailUrl = null;

            // Structure 1: Modern Strapi v4 with data.attributes.url
            if (category.attributes.thumbnail.data && category.attributes.thumbnail.data.attributes?.url) {
                thumbnailUrl = category.attributes.thumbnail.data.attributes.url;
            }
            // Structure 2: Object with direct URL property
            else if (category.attributes.thumbnail.url) {
                thumbnailUrl = category.attributes.thumbnail.url;
            }
            // Structure 3: Nested data array format
            else if (
                Array.isArray(category.attributes.thumbnail.data) &&
                category.attributes.thumbnail.data.length > 0
            ) {
                const firstItem = category.attributes.thumbnail.data[0];
                if (firstItem && 'attributes' in firstItem && firstItem.attributes && 'url' in firstItem.attributes) {
                    thumbnailUrl = firstItem.attributes.url;
                }
            }

            // If we found a URL, process it
            if (thumbnailUrl) {
                // Format the URL properly
                if (thumbnailUrl.startsWith('http')) {
                    imageUrl = thumbnailUrl;
                } else if (thumbnailUrl.startsWith('/')) {
                    imageUrl = `${STRAPI_API_URL}${thumbnailUrl}`;
                } else {
                    imageUrl = `${STRAPI_API_URL}/${thumbnailUrl}`;
                }

                // Verify the image loads correctly with a timeout
                try {
                    const testImg = new Image();

                    // Set a timeout to prevent waiting too long for image load
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Image load timeout')), 5000);
                    });

                    const loadPromise = new Promise((resolve, reject) => {
                        testImg.onload = () => {
                            resolve('success');
                        };
                        testImg.onerror = (e) => {
                            reject(new Error('Image load failed'));
                        };
                        testImg.src = imageUrl;
                    });

                    // Race between load and timeout
                    await Promise.race([loadPromise, timeoutPromise]);
                    isLoading = false;
                } catch (error) {
                    await useUnsplashFallback();
                }
            } else {
                await useUnsplashFallback();
            }
        } else {
            await useUnsplashFallback();
        }
    }

    // Helper to use Unsplash fallback
    async function useUnsplashFallback() {
        try {
            imageUrl = await getRandomImageByQuery(category.attributes.name);
        } catch (error) {
            // Use a default image as last resort
            imageUrl =
                'https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D&w=1000&q=80';
        }
        isLoading = false;
    }

    function handleRemove() {
        dispatch('remove', category.id);
    }

    function handleEdit() {
        const newName = prompt('Enter new category name:', category.attributes.name);
        if (newName && newName.trim() !== '') {
            category.attributes.name = newName.trim();
        }
    }
</script>

<a
    href={isAdmin ? `/${category.attributes.name}?admin=true` : `/${category.attributes.name}`}
    class="category-card aspect-[3/4] min-w-[240px] max-w-[320px] w-full !m-auto block transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1 relative h-full"
>
    <div
        class="category-card-border absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
    ></div>
    <div class="w-full h-full relative">
        {#if !isLoading}
            <div class="w-full h-full transition-all duration-300 hover:brightness-110 hover:contrast-[1.05]">
                <img
                    src={imageUrl}
                    alt={category.attributes.name}
                    class="w-full h-full object-cover image-filter transition-[filter] duration-300 ease-out"
                />
            </div>
        {/if}

        <div class="absolute inset-0 flex items-center justify-center">
            <h3
                class="flex justify-center items-center card-title font-didot text-2xl transition-all duration-300 text-white text-center px-4 h-24 w-full bg-black bg-opacity-20 shadow-text"
            >
                {category.attributes.name}
            </h3>
        </div>

        {#if isAdmin}
            <div class="absolute top-2 right-2 flex space-x-2">
                <button
                    class="bg-gray-800 bg-opacity-30 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    class="bg-gray-800 bg-opacity-30 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleRemove}
                    aria-label="Remove category"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</a>

<style lang="scss">
    .image-filter {
        filter: sepia(0.2) brightness(0.92) saturate(0.85);
    }

    .shadow-text {
        text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.8);
    }

    .category-card:hover {
        .card-title {
            opacity: 1;
            transform: scale(1.1);
            background-color: rgba(0, 0, 0, 0.2);
            --tw-backdrop-blur: blur(2px);
            -webkit-backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast)
                var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert)
                var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
            backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast)
                var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert)
                var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
        }
        .category-card-border {
            opacity: 1;
        }
        .image-filter {
            filter: sepia(0) brightness(1) saturate(1.1);
        }
    }
</style>
