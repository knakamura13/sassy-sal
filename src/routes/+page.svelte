<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';
    import { addCategory, deleteCategory, getCategories, updateCategory } from '$lib/services/strapi';
    import { addDeletedCategory, deletedCategories } from '$lib/stores/deletedCategoriesStore';

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

    // Filter out deleted categories (those in our local deletion tracking)
    $: filteredCategories = categories.filter((cat) => !$deletedCategories.includes(cat.id));

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

                    // After successful deletion, fetch updated categories from Strapi
                    try {
                        const updatedCategories = await getCategories();

                        // Check if the deleted category is still in the response
                        const categoryStillExists = updatedCategories.some((cat: Category) => cat.id === id);

                        if (categoryStillExists) {
                            // Track this category as deleted in our store
                            addDeletedCategory(id);
                        }
                        categories = updatedCategories;
                    } catch (fetchError) {
                        // Fallback to local state update and track as deleted
                        addDeletedCategory(id);
                        categories = categories.filter((cat: Category) => cat.id !== id);
                        alert('Category deleted, but there was an error refreshing the category list.');
                    }
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

                // Since the thumbnail association might not be immediately available,
                // fetch all categories again to get the most updated data
                try {
                    const updatedCategories = await getCategories();
                    if (updatedCategories && updatedCategories.length > 0) {
                        categories = updatedCategories;
                        alert('Category added successfully');
                        return;
                    }
                } catch (refreshError) {
                    // Handle error silently
                }

                // Only add the category directly if we didn't refresh the categories list
                categories = [...categories, savedCategory];
                alert('Category added successfully');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        }
    }

    // Function to handle category update
    async function handleUpdateCategory(event: CustomEvent<any>) {
        try {
            const { id, data } = event.detail;

            if ($adminMode) {
                try {
                    // Update in Strapi
                    await updateCategory(id, data);

                    // Mark as modified for admin save button
                    isModified = true;

                    // Since the thumbnail association might not be immediately available,
                    // fetch all categories again to get the most updated data
                    try {
                        const updatedCategories = await getCategories();
                        if (updatedCategories && updatedCategories.length > 0) {
                            categories = updatedCategories;
                            return;
                        }
                    } catch (refreshError) {
                        // Handle error silently
                    }

                    // Update the category locally
                    categories = categories.map((cat) => (cat.id === id ? { ...cat, ...data.data } : cat));
                } catch (updateError: any) {
                    // Handle 404 errors specifically
                    if (
                        updateError.status === 404 ||
                        (typeof updateError.message === 'string' && updateError.message.includes('404'))
                    ) {
                        alert('Category not found. It may have been deleted from the server.');

                        // Refresh categories to show current state
                        try {
                            const updatedCategories = await getCategories();
                            if (updatedCategories && updatedCategories.length > 0) {
                                categories = updatedCategories;
                            }
                        } catch (refreshError) {
                            // If refresh fails, remove the category from local state
                            categories = categories.filter((cat) => cat.id !== id);
                        }
                    } else {
                        // For other errors
                        alert(`Failed to update category: ${updateError.message || 'Unknown error'}`);
                    }
                    throw updateError; // Re-throw to be caught by the outer catch
                }
            }
        } catch (error) {
            console.error('Error updating category:', error);
        }
    }
</script>

<div class="page relative min-h-[100vh]" id="home">
    <div class="container mx-auto px-4">
        <div class="category-container py-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each filteredCategories as category (category.id)}
                    <CategoryCard
                        {category}
                        isAdmin={$adminMode}
                        on:remove={handleRemoveCategory}
                        on:update={handleUpdateCategory}
                    />
                {/each}

                {#if $adminMode}
                    <CategoryUploadPlaceholder on:addCategory={handleAddCategory} />
                {/if}
            </div>

            {#if $adminMode && isModified}
                <div class="admin-actions mt-6 flex space-x-4">
                    <button
                        class="font-didot px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        on:click={saveChanges}
                    >
                        Save Changes
                    </button>
                    <button
                        class="font-didot px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                        on:click={discardChanges}
                    >
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
        font-family: 'Garamond Libre', serif;
    }
</style>
