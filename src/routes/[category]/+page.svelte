<script lang="ts">
    import { page } from '$app/stores';
    import { adminMode } from '$lib/stores/adminStore';

    // Get data from Strapi via server load function
    export let data;
    const { category } = data;

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }
</script>

<svelte:head>
    <title>{category.name} | Photography Portfolio</title>
</svelte:head>

<div class="category-page relative min-h-[100vh]">
    <div class="container mx-auto px-4 py-8">
        <div class="category-header mb-4">
            <a href={$adminMode ? '/?admin=true' : '/'} class="text-blue-600 hover:underline mb-2 inline-block"
                >← Back</a
            >
            <h1 class="text-3xl font-medium mt-2">{category.name}</h1>
            {#if category.description}
                <p class="text-lg text-gray-600 mt-2">{category.description}</p>
            {/if}
        </div>

        {#if category.images && category.images.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each category.images as image}
                    <div class="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <img
                            src={`${import.meta.env.VITE_STRAPI_URL}${image.attributes.image.data.attributes.url}`}
                            alt={image.attributes.alt || image.attributes.title}
                            class="w-full h-64 object-cover"
                        />
                        {#if image.attributes.title}
                            <div class="p-4">
                                <h3 class="text-lg font-semibold">{image.attributes.title}</h3>
                                {#if image.attributes.description}
                                    <p class="text-sm text-gray-600">{image.attributes.description}</p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-gray-500">No images found in this category.</p>
        {/if}
    </div>
</div>
