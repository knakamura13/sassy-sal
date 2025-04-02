<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { categoryStore, type Category } from '$lib/stores/categoryStore';
    import { imageStore, type Image } from '$lib/stores/imageStore';
    import { adminMode } from '$lib/stores/adminStore';
    import Gallery from '$lib/components/gallery/Gallery.svelte';

    // Get data from loader
    export let data;

    let currentCategory: Category | undefined;
    let categoryImages: Image[] = [];
    let categorySlug: string = data.categorySlug;

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }

    onMount(() => {
        // Find the category by slug
        const unsubscribeCategory = categoryStore.subscribe((categories) => {
            currentCategory = categories.find((cat) => cat.slug === categorySlug);
        });

        // Get images for this category
        const unsubscribeImages = imageStore.subscribe((images) => {
            categoryImages = images.filter((img) => img.categoryId === currentCategory?.id);
        });

        return () => {
            unsubscribeCategory();
            unsubscribeImages();
        };
    });
</script>

<svelte:head>
    {#if currentCategory}
        <title>{currentCategory.name} | Photography Portfolio</title>
    {:else}
        <title>Category | Photography Portfolio</title>
    {/if}
</svelte:head>

<div class="category-page relative min-h-[100vh]">
    <div class="container mx-auto px-4 py-8">
        {#if currentCategory}
            <div class="category-header mb-4">
                <a href={$adminMode ? '/?admin=true' : '/'} class="text-blue-600 hover:underline mb-2 inline-block"
                    >← Back</a
                >
                <h1 class="text-3xl font-medium mt-2">{currentCategory.name}</h1>
                {#if currentCategory.description}
                    <p class="text-lg text-gray-600 mt-2">{currentCategory.description}</p>
                {/if}
            </div>

            <Gallery images={categoryImages} isCategory={true} categoryId={currentCategory.id} />
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
