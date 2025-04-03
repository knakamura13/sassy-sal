<script lang="ts">
    import { onMount } from 'svelte';
    import { adminMode } from '$lib/stores/adminStore';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';
    import { addCategory, deleteCategory } from '$lib/services/strapi';

    // Define the Category interface for Strapi data
    interface Category {
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
                };
            };
        };
    }

    // Define the data from page server load
    interface PageData {
        admin?: boolean;
        categories: Category[];
    }

    // Get data from server load function
    export let data: PageData;

    // Local copy of categories for editing in admin mode
    let categories = data.categories || [];
    let isModified = false;

    // Set admin mode from URL parameter
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Function to handle saving changes to Strapi
    async function saveChanges() {
        try {
            // In a real implementation, this would update Strapi with all changes
            alert('Changes saved successfully');
            isModified = false;
            // Reload the page to get fresh data
            window.location.reload();
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes');
        }
    }

    // Function to discard changes
    function discardChanges() {
        // Reset to original data from server
        categories = [...data.categories];
        isModified = false;
        alert('Changes discarded');
    }

    // Function to handle category removal
    async function handleRemoveCategory(event: CustomEvent<string | number>) {
        const id = event.detail;

        if (confirm('Are you sure you want to delete this category?')) {
            try {
                if ($adminMode) {
                    // Only try to remove from Strapi in admin mode
                    await deleteCategory(id);
                    alert('Category deleted successfully');
                    // Remove from local state too
                    categories = categories.filter((cat: Category) => cat.id !== id);
                }
            } catch (error) {
                console.error('Error removing category:', error);
                alert('Failed to delete category');
            }
        }
    }

    // Function to handle new category addition
    async function handleAddCategory(event: CustomEvent<any>) {
        try {
            const newCategory = event.detail;

            if ($adminMode) {
                // Add to Strapi
                const savedCategory = await addCategory(newCategory);
                categories = [...categories, savedCategory];
                alert('Category added successfully');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        }
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
                    <CategoryCard {category} isAdmin={$adminMode} on:remove={handleRemoveCategory} />
                {/each}

                {#if $adminMode}
                    <CategoryUploadPlaceholder on:addCategory={handleAddCategory} />
                {/if}
            </div>

            {#if $adminMode && isModified}
                <div class="admin-actions mt-6 flex space-x-4">
                    <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded" on:click={saveChanges}>
                        Save Changes
                    </button>
                    <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded" on:click={discardChanges}>
                        Discard Changes
                    </button>
                </div>
            {/if}
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
