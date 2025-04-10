<script lang="ts">
    import { onMount } from 'svelte';

    import { adminMode } from '$lib/stores/adminStore';
    import { client, urlFor } from '$lib/services/sanity';
    import { deletedCategories } from '$lib/stores/deletedCategoriesStore';
    import { goto } from '$app/navigation';
    import Gallery from '$lib/components/gallery/Gallery.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Define the type for Sanity image URL builder
    type SanityImageUrl = {
        url: () => string;
    };

    // Define Sanity types
    interface SanityImage {
        id: string;
        _id?: string;
        documentId?: string;
        attributes?: {
            title?: string;
            description?: string;
            order?: number;
            image?: {
                data?: {
                    attributes?: {
                        url: string;
                        alternativeText?: string;
                        fullSizeUrl?: string;
                        order?: number;
                    };
                };
            };
        };
        // Support for flat structure
        title?: string;
        description?: string;
        url?: string;
        fullSizeUrl?: string;
        order?: number;
        image?: any; // Sanity image reference
    }

    interface SanityCategory {
        id: string;
        _id?: string;
        attributes: {
            name: string;
            description?: string;
            order?: number;
            images?: {
                data: SanityImage[];
            };
        };
    }

    // Get data from server load function
    export let data: {
        category?: SanityCategory;
        admin?: boolean;
        isFallback?: boolean;
    };

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Get the category from the server data - ensure it exists
    let category = data?.category;
    let categoryImages: SanityImage[] = [];
    let isFallback = data?.isFallback || false;
    let loadingImageUrls = false;
    let imageUrlsLoaded = false;

    // Check if this category is in our deleted list
    onMount(() => {
        if (category && $deletedCategories.includes(category.id)) {
            goto('/');
        }
    });

    // Watch for changes to deleted categories store
    $: if (category && $deletedCategories.includes(category.id)) {
        goto('/');
    }

    // Transformed images in the format expected by Gallery component
    let galleryImages: Image[] = [];

    // Safely extract images from category data
    $: {
        if (category && category.attributes && category.attributes.images) {
            if (category.attributes.images.data && Array.isArray(category.attributes.images.data)) {
                categoryImages = category.attributes.images.data;
            } else if (Array.isArray(category.attributes.images)) {
                categoryImages = category.attributes.images as SanityImage[];
            } else {
                categoryImages = [];
            }
        } else {
            categoryImages = [];
        }
    }

    // Function to load image URLs if needed
    async function loadImageUrls() {
        if (loadingImageUrls || imageUrlsLoaded || categoryImages.length === 0) return;

        loadingImageUrls = true;

        try {
            for (let i = 0; i < categoryImages.length; i++) {
                const image = categoryImages[i];

                // Check for URL in different possible locations
                const hasNestedUrl = !!image.attributes?.image?.data?.attributes?.url;
                const hasDirectUrl = !!image.url;

                // Skip if image already has a URL in any format
                if (hasNestedUrl || hasDirectUrl) {
                    continue;
                }

                // If image has documentId but no URL, fetch it
                const imageId = image.documentId || image._id || image.id;
                if (imageId && !image.url && !image.attributes?.image?.data?.attributes?.url) {
                    try {
                        // Use Sanity client to fetch the image data
                        const imageData = await client.fetch(`*[_type == "galleryImage" && _id == $id][0]`, {
                            id: imageId
                        });

                        if (imageData && imageData.image) {
                            // Generate URLs using Sanity's urlFor helper
                            const imageUrl = (urlFor(imageData.image) as SanityImageUrl).url();

                            // Update categoryImages array to ensure the UI updates
                            const index = categoryImages.findIndex((img) => img.id === image.id);
                            if (index !== -1) {
                                categoryImages[index].url = imageUrl;
                                categoryImages[index].fullSizeUrl = imageUrl;

                                // If nested structure exists, update it too
                                if (categoryImages[index].attributes?.image?.data?.attributes) {
                                    categoryImages[index].attributes.image.data.attributes.url = imageUrl;
                                    categoryImages[index].attributes.image.data.attributes.fullSizeUrl = imageUrl;
                                }

                                // Force UI refresh by creating a new array
                                categoryImages = [...categoryImages];
                            }
                        } else {
                            console.warn(`⚠️ No image data found for image ${imageId} in API response`);
                        }
                    } catch (error) {
                        console.error(`❌ Error fetching image ${imageId}:`, error);
                    }
                }
            }

            imageUrlsLoaded = true;
        } catch (error) {
            console.error('❌ Error loading image URLs:', error);
        } finally {
            loadingImageUrls = false;
        }
    }

    // Call the function when component loads if we have images
    $: if (categoryImages.length > 0 && !imageUrlsLoaded && !loadingImageUrls) {
        loadImageUrls();
    }

    // Transform categoryImages to Gallery-compatible format
    $: {
        galleryImages = categoryImages.map((image) => {
            // Extract title from different possible locations
            const title = image.attributes?.title || image.title || 'Untitled';

            // Get the URL from different possible locations
            let url = '';

            // Try to get URL from all possible locations in the response structure
            if (image.url) {
                url = image.url;
            } else if (image.attributes?.image?.data?.attributes?.url) {
                url = image.attributes.image.data.attributes.url;
            } else if (image.image) {
                // Handle Sanity image object
                url = (urlFor(image.image) as SanityImageUrl).url();
            }

            // Get the alt text
            const alt = image.attributes?.image?.data?.attributes?.alternativeText || title;

            // Fix the type error by ensuring categoryId is always a string
            const categoryId = category ? String(category.id) : '0';

            // Extract the documentId for Sanity operations
            const documentId = image.documentId || image._id || null;

            // Extract the order attribute if available, default to 0
            const order =
                image.order !== undefined
                    ? image.order
                    : image.attributes?.order !== undefined
                      ? image.attributes.order
                      : image.attributes?.image?.data?.attributes?.order !== undefined
                        ? image.attributes.image.data.attributes.order
                        : 0;

            return {
                id: String(image.id),
                title,
                url,
                alt,
                categoryId,
                documentId, // Add documentId for Sanity operations
                strapiId: image.id, // Keep the original ID as strapiId for backwards compatibility
                order // Include the order attribute for sorting
            };
        });
    }

    // Check for additional specific URL path variations
    $: {
        if (galleryImages.length > 0) {
            const imagesWithoutUrls = galleryImages.filter((img) => !img.url);
            if (imagesWithoutUrls.length > 0) {
                // Find the corresponding original images
                for (const image of imagesWithoutUrls) {
                    const originalImage = categoryImages.find((img) => String(img.id) === image.id);
                    if (originalImage) {
                        // Try to generate URL using Sanity's urlFor if image property exists
                        if (originalImage.image) {
                            const imageUrl = (urlFor(originalImage.image) as SanityImageUrl).url();

                            // Update the URL in the gallery image
                            image.url = imageUrl;

                            // Also update the images array for next render
                            const index = galleryImages.findIndex((img) => img.id === image.id);
                            if (index !== -1) {
                                galleryImages[index].url = imageUrl;
                            }
                        }
                    }
                }
            }
        }
    }

    // Retry loading the page
    function retryLoading() {
        window.location.reload();
    }
</script>

<svelte:head>
    {#if category}
        <title>{category.attributes.name} | Photography Portfolio</title>
    {:else}
        <title>Category | Photography Portfolio</title>
    {/if}
</svelte:head>

<div class="category-page relative min-h-[100vh]">
    <div class="container mx-auto px-4 py-8">
        {#if category}
            <div class="category-header mb-4">
                <h1 class="text-3xl font-medium mt-2 text-center w-full">{category.attributes.name}</h1>
                {#if category.attributes.description}
                    <p class="text-lg text-gray-600 mt-2">{category.attributes.description}</p>
                {/if}
            </div>

            {#if isFallback}
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                We had trouble loading the full category data. You're seeing limited information.
                            </p>
                            <button
                                class="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600 underline"
                                on:click={retryLoading}
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            {#if loadingImageUrls}
                <!-- TODO: add a loading spinner here, but ensure it does not add content shift to the page -->
            {/if}

            {#if !galleryImages.length}
                <div class="col-span-full py-8 text-center">
                    <p class="text-lg text-gray-600 mb-4">No images in this category yet.</p>
                </div>
            {/if}

            <Gallery images={galleryImages} categoryId={String(category.id)} />
        {:else}
            <div class="text-center py-12">
                <h1 class="text-2xl font-medium text-gray-800">Category not found</h1>
                <p class="mt-4">The category you're looking for doesn't exist.</p>
                <a href="/" class="inline-block mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white">
                    Return to Home
                </a>
            </div>
        {/if}
    </div>
</div>
