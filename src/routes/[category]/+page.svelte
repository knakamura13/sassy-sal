<script lang="ts">
    // Add debugging information to the console
    console.log('🔍 Loading category page component');

    import { page } from '$app/stores';
    import { adminMode } from '$lib/stores/adminStore';
    import Gallery from '$lib/components/gallery/Gallery.svelte';
    import ImageUploadPlaceholder from '$lib/components/gallery/ImageUploadPlaceholder.svelte';
    import { onMount } from 'svelte';

    // Define Strapi types
    interface StrapiImage {
        id: number;
        attributes: {
            title: string;
            description?: string;
            image?: {
                data?: {
                    attributes?: {
                        url: string;
                        width?: number;
                        height?: number;
                        alternativeText?: string;
                    };
                };
            };
        };
    }

    interface StrapiCategory {
        id: number;
        attributes: {
            name: string;
            slug: string;
            description?: string;
            images?: {
                data: StrapiImage[];
            };
        };
    }

    // Get data from server load function
    export let data: {
        category?: StrapiCategory;
        admin?: boolean;
        isFallback?: boolean;
    };

    // Debug - log the entire data object
    console.log('📦 Raw data passed to component:', JSON.stringify(data));

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Get the category from the server data - ensure it exists
    let category = data?.category;
    let categoryImages: StrapiImage[] = [];
    let isFallback = data?.isFallback || false;

    onMount(() => {
        console.log(
            '🏔️ Component mounted with data:',
            JSON.stringify({
                hasCategory: !!category,
                hasData: !!data,
                categoryId: category?.id,
                admin: data?.admin
            })
        );
    });

    // Safely extract images from category data
    $: {
        if (category && category.attributes && category.attributes.images) {
            if (category.attributes.images.data && Array.isArray(category.attributes.images.data)) {
                categoryImages = category.attributes.images.data;
            } else if (Array.isArray(category.attributes.images)) {
                categoryImages = category.attributes.images as StrapiImage[];
            } else {
                categoryImages = [];
            }
        } else {
            categoryImages = [];
        }

        // Log the images for debugging
        console.log(`📋 Category images extracted:`, {
            count: categoryImages.length,
            first: categoryImages.length > 0 ? JSON.stringify(categoryImages[0]) : 'none'
        });
    }

    // Log the category data for debugging - with null checks
    if (category) {
        console.log(
            `📋 Category data:`,
            JSON.stringify({
                id: category?.id,
                name: category?.attributes?.name,
                imageCount: categoryImages.length,
                isFallback
            })
        );
    } else {
        console.log('⚠️ Category data is null or undefined');
    }

    // Function to handle image upload success
    function handleImageAdded(event: CustomEvent<any>) {
        const uploadedImage = event.detail;
        console.log(`✅ Image uploaded successfully:`, uploadedImage);
        console.log(
            `📋 Image details - ID: ${uploadedImage.id}, Category association: ${JSON.stringify(uploadedImage.attributes?.category)}`
        );

        // Show a success message
        alert('Image uploaded successfully! Refreshing the page to show the new image.');

        // Refresh the page to show the newly added image
        // Use a small timeout to ensure the alert is shown before refresh
        setTimeout(() => {
            // Force a complete reload to ensure we get fresh data from the server
            window.location.href = window.location.href;
        }, 500);
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
                <a href={$adminMode ? '/?admin=true' : '/'} class="text-blue-600 hover:underline mb-2 inline-block"
                    >← Back</a
                >
                <h1 class="text-3xl font-medium mt-2">{category.attributes.name}</h1>
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

            <div class="image-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#if categoryImages.length > 0}
                    {#each categoryImages as image (image.id)}
                        <div class="image-item overflow-hidden rounded-lg shadow-md">
                            {#if image?.attributes?.image?.data?.attributes?.url}
                                <img
                                    src={image.attributes.image.data.attributes.url}
                                    alt={image.attributes.image.data.attributes.alternativeText ||
                                        image.attributes.title ||
                                        'Gallery image'}
                                    class="w-full aspect-square object-cover"
                                />
                            {:else}
                                <div
                                    class="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400"
                                >
                                    <span>Image not available</span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {:else}
                    <div class="col-span-full py-8 text-center">
                        <p class="text-lg text-gray-600 mb-4">No images in this category yet.</p>
                    </div>
                {/if}

                {#if $adminMode && category}
                    <!-- Display category ID for debugging - now visible for debugging -->
                    <div class="debug-info text-xs text-gray-600 col-span-full mb-2">
                        Using category ID: {category.id}
                    </div>
                    <ImageUploadPlaceholder categoryId={category.id} on:imageAdded={handleImageAdded} />
                {/if}
            </div>
        {:else}
            <div class="text-center py-12">
                <h1 class="text-2xl font-medium text-gray-800">Category not found</h1>
                <p class="mt-4">The category you're looking for doesn't exist.</p>
                <a href="/" class="inline-block mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                    Return to Home
                </a>
            </div>
        {/if}
    </div>
</div>
