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
            thumbnail?: {
                data: {
                    attributes: {
                        url: string;
                    };
                } | null;
            };
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

    onMount(async () => {
        console.log(`[DEBUG] CategoryCard mounted for category: ${category.attributes.name} (ID: ${category.id})`);
        console.log(`[DEBUG] Full category data:`, JSON.stringify(category, null, 2));
        await loadImage();
    });

    // Function to load image from thumbnail or Unsplash
    async function loadImage() {
        isLoading = true;

        console.log(`[DEBUG] Loading image for category: ${category.attributes.name} (ID: ${category.id})`);

        // Check if the category has a thumbnail property
        if (category.attributes.thumbnail) {
            console.log(`[DEBUG] Thumbnail property exists in category`);
            console.log(`[DEBUG] Raw thumbnail data:`, JSON.stringify(category.attributes.thumbnail, null, 2));

            // Check data property exists and is not null
            if (category.attributes.thumbnail.data) {
                console.log(`[DEBUG] Thumbnail data property exists and is not undefined`);

                if (category.attributes.thumbnail.data === null) {
                    console.warn(`[DEBUG] ⚠️ Thumbnail data is NULL - image reference exists but is empty`);
                    await useUnsplashFallback();
                    return;
                }

                // Check attributes and URL exist
                if (category.attributes.thumbnail.data.attributes?.url) {
                    const thumbnailUrl = category.attributes.thumbnail.data.attributes.url;
                    console.log(`[DEBUG] Raw thumbnail URL found: ${thumbnailUrl}`);

                    // Check URL format and construct proper URL
                    if (thumbnailUrl.startsWith('http')) {
                        console.log(`[DEBUG] Thumbnail URL is absolute, using as-is`);
                        imageUrl = thumbnailUrl;
                    } else if (thumbnailUrl.startsWith('/')) {
                        console.log(`[DEBUG] Thumbnail URL is relative, prepending Strapi URL: ${STRAPI_API_URL}`);
                        imageUrl = `${STRAPI_API_URL}${thumbnailUrl}`;
                    } else {
                        console.warn(`[DEBUG] ⚠️ Thumbnail URL has unexpected format: ${thumbnailUrl}`);
                        imageUrl = `${STRAPI_API_URL}/${thumbnailUrl}`;
                    }

                    console.log(`[DEBUG] Final thumbnail URL: ${imageUrl}`);

                    // Verify the image loads correctly with a timeout
                    try {
                        console.log(`[DEBUG] Testing if thumbnail URL is valid: ${imageUrl}`);
                        const testImg = new Image();

                        // Set a timeout to prevent waiting too long for image load
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Image load timeout')), 5000);
                        });

                        const loadPromise = new Promise((resolve, reject) => {
                            testImg.onload = () => {
                                console.log(`[DEBUG] ✅ Thumbnail loaded successfully: ${imageUrl}`);
                                resolve('success');
                            };
                            testImg.onerror = (e) => {
                                console.error(`[DEBUG] ❌ Failed to load thumbnail: ${imageUrl}, Error:`, e);
                                reject(new Error('Image load failed'));
                            };
                            testImg.src = imageUrl;
                        });

                        // Race between load and timeout
                        await Promise.race([loadPromise, timeoutPromise]);
                        isLoading = false;
                    } catch (error) {
                        console.error(`[DEBUG] ❌ Error loading thumbnail image:`, error);
                        await useUnsplashFallback();
                    }
                } else {
                    console.warn(`[DEBUG] ⚠️ Thumbnail data exists but URL is missing in the attributes`);
                    await useUnsplashFallback();
                }
            } else {
                console.warn(`[DEBUG] ⚠️ Thumbnail property exists but data property is undefined`);
                await useUnsplashFallback();
            }
        } else {
            console.log(`[DEBUG] No thumbnail property found for category ${category.attributes.name}`);
            await useUnsplashFallback();
        }
    }

    // Helper to use Unsplash fallback
    async function useUnsplashFallback() {
        console.log(`[DEBUG] 🔄 Using Unsplash fallback for category ${category.attributes.name}`);
        try {
            imageUrl = await getRandomImageByQuery(category.attributes.name);
            console.log(`[DEBUG] ✅ Loaded Unsplash image: ${imageUrl}`);
        } catch (error) {
            console.error(`[DEBUG] ❌ Failed to load Unsplash image:`, error);
            // Use a default image as last resort
            imageUrl =
                'https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D&w=1000&q=80';
            console.log(`[DEBUG] Using default fallback image`);
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
                class="card-title font-didot text-2xl transition-all duration-300 text-white text-center px-4 py-10 w-full backdrop-blur-sm bg-black bg-opacity-30 shadow-text"
            >
                {category.attributes.name}
            </h3>
        </div>

        {#if isAdmin}
            <div class="absolute top-2 right-2 flex space-x-2">
                <button
                    class="bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    class="bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none shadow-md"
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
            background-color: rgba(0, 0, 0, 0.5);
        }
        .category-card-border {
            opacity: 1;
        }
        .image-filter {
            filter: sepia(0) brightness(1) saturate(1.1);
        }
    }
</style>
