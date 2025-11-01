<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

    import { adminMode } from '$lib/stores/adminStore';
    import { client } from '$lib/services/sanity/client';
    import { deletedCategories } from '$lib/stores/deletedCategoriesStore';
    import { getImageUrls, urlForBuilder } from '$lib/services/imageConfig';
    import { goto } from '$app/navigation';
    import Gallery from '$lib/components/gallery/Gallery.svelte';
    import CategoryPasswordForm from '$lib/components/category/CategoryPasswordForm.svelte';
    import type { Image } from '$lib/stores/imageStore';

    // Define the type for Sanity image URL builder
    type SanityImageUrl = ImageUrlBuilder;

    // Define Sanity types
    interface SanityImage {
        id: string;
        _id?: string;
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
                        placeholderUrl?: string;
                        thumbnailUrl?: string;
                        order?: number;
                        responsive?: {
                            small?: string;
                            medium?: string;
                            large?: string;
                        };
                    };
                };
            };
        };
        // Support for flat structure
        title?: string;
        description?: string;
        url?: string;
        fullSizeUrl?: string;
        placeholderUrl?: string;
        thumbnailUrl?: string;
        order?: number;
        image?: any; // Sanity image reference
        responsiveUrls?: {
            small?: string;
            medium?: string;
            large?: string;
        };
        aspectRatio?: number;
        spanTwoColumns?: boolean;
    }

    interface SanityCategory {
        id: string;
        _id?: string;
        attributes: {
            name: string;
            description?: string;
            order?: number;
            thumbnail?: any;
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
        requiresPassword?: boolean;
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

    // Password protection state
    let requiresPassword = data?.requiresPassword || false;
    let passwordError = '';
    let passwordLoading = false;

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

                // If image has _id but no URL, fetch it
                const imageId = image._id || image.id;
                if (imageId && !image.url && !image.attributes?.image?.data?.attributes?.url) {
                    try {
                        // Use Sanity client to fetch the image data
                        const imageData = await client.fetch(`*[_type == "galleryImage" && _id == $id][0]`, {
                            id: imageId
                        });

                        if (imageData && imageData.image) {
                            // Generate URLs using Sanity's urlFor helper
                            const imageUrl = (urlForBuilder(imageData.image) as SanityImageUrl).url();

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

    // Update the image transformation to include responsive URLs
    $: {
        galleryImages = categoryImages.map((image, index) => {
            // Extract title from different possible locations
            const title = image.attributes?.title || image.title || 'Untitled';

            // Get the URL from different possible locations
            let url = '';
            let placeholderUrl = '';
            let fullSizeUrl = '';
            let responsiveUrls = undefined;

            // Try to get URL from all possible locations in the response structure
            if (image.url) {
                url = image.url;
                // If we have a direct URL but no optimized versions, use the same URL for all
                if (!image.fullSizeUrl) {
                    fullSizeUrl = image.url;
                }
                // Use existing responsive URLs if available
                if (image.responsiveUrls) {
                    responsiveUrls = image.responsiveUrls;
                }
            } else if (image.attributes?.image?.data?.attributes?.url) {
                url = image.attributes.image.data.attributes.url;
                // Get full size URL if available
                fullSizeUrl = image.attributes.image.data.attributes.fullSizeUrl || url;
                // Get placeholder if available
                placeholderUrl = image.attributes.image.data.attributes.placeholderUrl || '';
                // Check for responsive URLs in the attributes
                if (image.attributes.image.data.attributes.responsive) {
                    responsiveUrls = {
                        small: image.attributes.image.data.attributes.responsive.small || url,
                        medium: image.attributes.image.data.attributes.responsive.medium || fullSizeUrl,
                        large: image.attributes.image.data.attributes.responsive.large || fullSizeUrl
                    };
                }
            } else if (image.image) {
                // Handle Sanity image object
                try {
                    // Use centralized image URL configuration
                    const urls = getImageUrls(image.image);
                    placeholderUrl = urls.placeholder;
                    url = urls.medium;
                    fullSizeUrl = urls.large;
                    // Add responsive URLs
                    responsiveUrls = urls.responsive;
                } catch (error) {
                    console.error('Error generating image URLs:', error);
                    url = '';
                }
            }

            // Get the alt text
            const alt = image.attributes?.image?.data?.attributes?.alternativeText || title;

            // Fix the type error by ensuring categoryId is always a string
            const categoryId = category ? String(category.id) : '0';

            // Extract the order attribute if available, default to 0
            const order =
                image.order !== undefined
                    ? image.order
                    : image.attributes?.order !== undefined
                      ? image.attributes.order
                      : image.attributes?.image?.data?.attributes?.order !== undefined
                        ? image.attributes.image.data.attributes.order
                        : 0;

            // Use aspect ratio calculated on server
            let aspectRatio: number | undefined = image.aspectRatio;

            const galleryImage = {
                id: String(image._id || image.id),
                title,
                url,
                alt,
                categoryId,
                order,
                placeholderUrl,
                fullSizeUrl,
                responsiveUrls: responsiveUrls
                    ? {
                          small: responsiveUrls.small || url,
                          medium: responsiveUrls.medium || fullSizeUrl || url,
                          large: responsiveUrls.large || fullSizeUrl || url
                      }
                    : undefined,
                aspectRatio,
                spanTwoColumns: image.spanTwoColumns
            };

            console.log('[+page.svelte] Transformed image:', {
                id: galleryImage.id,
                spanTwoColumns: galleryImage.spanTwoColumns,
                originalSpanTwoColumns: image.spanTwoColumns
            });

            return galleryImage;
        });
    }

    // Calculate aspect ratios for images that don't have them (client-side only)
    $: if (browser && galleryImages.length > 0 && !loadingImageUrls) {
        // Check for images without aspect ratios and calculate them
        galleryImages.forEach((image, index) => {
            if (image.aspectRatio === undefined && image.url) {
                const img = new Image();
                img.onload = () => {
                    if (img.naturalWidth && img.naturalHeight) {
                        const calculatedRatio = img.naturalWidth / img.naturalHeight;
                        galleryImages[index].aspectRatio = calculatedRatio;
                        galleryImages = [...galleryImages]; // Trigger reactivity
                    }
                };
                img.src = image.url;
            }
        });
    }

    // Also update the second image URL generation for images without URLs
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
                            try {
                                // Use centralized image URL configuration
                                const urls = getImageUrls(originalImage.image);

                                // Update the URLs in the gallery image
                                image.url = urls.medium;
                                image.placeholderUrl = urls.placeholder;
                                image.fullSizeUrl = urls.large;
                                image.responsiveUrls = urls.responsive
                                    ? {
                                          small: urls.responsive.small || urls.medium,
                                          medium: urls.responsive.medium || urls.large || urls.medium,
                                          large: urls.responsive.large || urls.large || urls.medium
                                      }
                                    : undefined;

                                // Also update the images array for next render
                                const index = galleryImages.findIndex((img) => img.id === image.id);
                                if (index !== -1) {
                                    galleryImages[index].url = urls.medium;
                                    galleryImages[index].placeholderUrl = urls.placeholder;
                                    galleryImages[index].fullSizeUrl = urls.large;
                                    galleryImages[index].responsiveUrls = urls.responsive
                                        ? {
                                              small: urls.responsive.small || urls.medium,
                                              medium: urls.responsive.medium || urls.large || urls.medium,
                                              large: urls.responsive.large || urls.large || urls.medium
                                          }
                                        : undefined;
                                }
                            } catch (error) {
                                console.error('Error generating image URLs:', error);
                            }
                        }
                    }
                }
            }
        }
    }

    // Handle password submission
    async function handlePasswordSubmit(event: CustomEvent<{ password: string }>) {
        passwordLoading = true;
        passwordError = '';

        try {
            // Call our server-side API endpoint to fetch the full category data
            const response = await fetch(
                `/api/category-password/${encodeURIComponent(category?.attributes.name || '')}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        password: event.detail.password
                    })
                }
            );

            const result = await response.json();

            if (result.success && result.category) {
                // Password correct - update the category data with the full information from server
                category = result.category;
                requiresPassword = false;
                passwordError = '';
            } else {
                passwordError = result.error || 'Incorrect password';
            }
        } catch (error) {
            console.error('Error in password submission:', error);
            passwordError = 'Error verifying password. Please try again.';
        } finally {
            passwordLoading = false;
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
    <div class="container mx-auto max-w-[1400px] px-4 py-8">
        {#if category}
            <div class="category-header mb-4">
                <h1 class="mt-2 w-full text-center text-3xl font-medium text-[#3f4a49]">
                    {category.attributes.name}
                </h1>
                {#if category.attributes.description}
                    <p class="mt-2 text-lg text-gray-600">{category.attributes.description}</p>
                {/if}
            </div>

            {#if requiresPassword && !$adminMode}
                <!-- Password form -->
                <CategoryPasswordForm
                    categoryName={category.attributes.name}
                    error={passwordError}
                    loading={passwordLoading}
                    on:submit={handlePasswordSubmit}
                />
            {:else}
                {#if isFallback}
                    <div class="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
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
                                    class="mt-2 text-sm font-medium text-yellow-700 underline hover:text-yellow-600"
                                    on:click={retryLoading}
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if loadingImageUrls}
                    <!-- loading state... -->
                {/if}

                {#if !galleryImages.length}
                    <div class="col-span-full py-8 text-center">
                        <p class="mb-4 text-lg text-gray-600">No images in this category yet.</p>
                    </div>
                {/if}

                <Gallery
                    images={galleryImages}
                    categoryId={String(category.id)}
                    categoryOrder={category.attributes.order}
                />
            {/if}
        {:else}
            <div class="py-12 text-center">
                <h1 class="text-2xl font-medium text-gray-800">Category not found</h1>
                <p class="mt-4">The category you're looking for doesn't exist.</p>
                <a href="/" class="mt-6 inline-block bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Return to Home
                </a>
            </div>
        {/if}
    </div>
</div>
