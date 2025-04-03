<script lang="ts">
    import { page } from '$app/stores';
    import { adminMode } from '$lib/stores/adminStore';
    import Gallery from '$lib/components/gallery/Gallery.svelte';

    // Define Strapi types
    interface StrapiImage {
        id: number;
        attributes: {
            title: string;
            description?: string;
            image: {
                data: {
                    attributes: {
                        url: string;
                        width: number;
                        height: number;
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
        category: StrapiCategory;
        admin?: boolean;
    };

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Get the category from the server data
    let category = data.category;
    let categoryImages = category?.attributes?.images?.data || [];
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

            <!-- Gallery component needs to be updated to work with Strapi image data -->
            <div class="image-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each categoryImages as image (image.id)}
                    <div class="image-item overflow-hidden rounded-lg shadow-md">
                        <img
                            src={image.attributes.image.data.attributes.url}
                            alt={image.attributes.image.data.attributes.alternativeText ||
                                image.attributes.title ||
                                'Gallery image'}
                            class="w-full aspect-square object-cover"
                        />
                    </div>
                {/each}

                {#if $adminMode}
                    <div
                        class="image-upload-placeholder aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center"
                    >
                        <div class="text-4xl text-gray-400 mb-2">+</div>
                        <div class="text-gray-500">Add Images</div>
                    </div>
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
