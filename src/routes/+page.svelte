<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';

    // Get data from Strapi via server load function
    export let data;
    const { categories } = data;

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }
</script>

<svelte:head>
    <title>Photography Portfolio</title>
</svelte:head>

<div class="page relative min-h-[100vh]" id="home">
    <section class="intro text-center my-8">
        <h1 class="text-3xl font-medium">Photography Portfolio</h1>
        <p class="text-lg text-gray-600 mt-2">Explore my photography collections</p>
    </section>

    <div class="container mx-auto px-4">
        <div class="category-container py-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each categories as category (category.id)}
                    <CategoryCard {category} isAdmin={$adminMode} />
                {/each}

                {#if $adminMode}
                    <CategoryUploadPlaceholder />
                {/if}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    /* Global styles - these will affect the app layout */
    :global(html, body) {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
    }
</style>
