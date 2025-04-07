<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';
    import { addCategory, deleteCategory, getCategories, updateCategory } from '$lib/services/strapi';
    import { addDeletedCategory, deletedCategories } from '$lib/stores/deletedCategoriesStore';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import { writable } from 'svelte/store';

    // Interface for category data from Strapi
    interface Category {
        id: string | number;
        attributes: {
            name: string;
            order: number;
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

    // Interface for data received from page server load function
    interface PageData {
        admin?: boolean;
        categories: Category[];
    }

    // Data from server load function
    export let data: PageData;

    // Working copy of categories that maintains current state
    let categories = data.categories || [];

    // Counter to force component re-renders when category data changes
    let updateCounter = 0;

    // Alert dialog state
    let showDeleteDialog = writable(false);
    let categoryToDelete = writable<string | number | null>(null);
    let categoryNameToDelete = writable<string>('');

    // Updates the categories state and forces component re-render
    function updateCategoriesAndRender(newCategories: Category[]) {
        // Deep copy to ensure reactivity when updating nested properties
        const categoriesCopy = JSON.parse(JSON.stringify(newCategories));
        categories = categoriesCopy;
        // Increment counter to trigger re-render
        updateCounter++;
    }

    // Reactive statement: filter deleted categories and sort by order, then by name
    $: filteredCategories = categories
        .filter((cat) => !$deletedCategories.includes(cat.id))
        .sort((a, b) => {
            // Primary sort by order (ascending)
            const orderDiff = a.attributes.order - b.attributes.order;
            if (orderDiff !== 0) return orderDiff;

            // Secondary sort by name for consistent ordering when order is the same
            return a.attributes.name.localeCompare(b.attributes.name);
        });

    // Reactive derived value for category grid that triggers re-renders
    $: categoryGrid = { categories: filteredCategories, updateCounter };

    // Set admin mode when URL parameter is present
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Handles category deletion with confirmation
    async function handleRemoveCategory(event: CustomEvent<string | number>) {
        const id = event.detail;
        $categoryToDelete = id;

        // Find the category name to display in the confirmation dialog
        const categoryToRemove = categories.find((cat) => cat.id === id);
        $categoryNameToDelete = categoryToRemove?.attributes?.name || 'Unknown';

        $showDeleteDialog = true;
    }

    // Performs the actual category deletion after confirmation
    async function confirmDeleteCategory() {
        const id = $categoryToDelete;
        if (!id) return;

        try {
            if ($adminMode) {
                // Delete from Strapi backend in admin mode
                await deleteCategory(id);

                // Refresh category list from server after deletion
                try {
                    const updatedCategories = await getCategories();

                    // If category still exists in response, track it as deleted locally
                    const categoryStillExists = updatedCategories.some((cat: Category) => cat.id === id);
                    if (categoryStillExists) {
                        addDeletedCategory(id);
                    }
                    updateCategoriesAndRender(updatedCategories);
                } catch (fetchError) {
                    // If server refresh fails, update local state and mark as deleted
                    addDeletedCategory(id);
                    const filteredCategories = categories.filter((cat: Category) => cat.id !== id);
                    updateCategoriesAndRender(filteredCategories);
                    alert('Category deleted, but there was an error refreshing the category list.');
                }
            }
        } catch (error) {
            console.error('Error removing category:', error);
            alert('Failed to delete category');
        } finally {
            // Reset alert dialog state
            $showDeleteDialog = false;
            $categoryToDelete = null;
            $categoryNameToDelete = '';
        }
    }

    // Cancels the delete operation
    function cancelDelete() {
        $showDeleteDialog = false;
        $categoryToDelete = null;
        $categoryNameToDelete = '';
    }

    // Handles adding a new category
    async function handleAddCategory(event: CustomEvent<any>) {
        try {
            const newCategory = event.detail;

            if ($adminMode) {
                // Save new category to Strapi
                const savedCategory = await addCategory(newCategory);

                // Refresh categories from server to get complete data with associations
                try {
                    const updatedCategories = await getCategories();
                    if (updatedCategories && updatedCategories.length > 0) {
                        updateCategoriesAndRender(updatedCategories);
                        alert('Category added successfully');
                        return;
                    }
                } catch (refreshError) {
                    // Silently continue if refresh fails
                }

                // Fallback: update local state with the saved category
                updateCategoriesAndRender([...categories, savedCategory]);
                alert('Category added successfully');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        }
    }

    // Handles updating an existing category
    async function handleUpdateCategory(event: CustomEvent<any>) {
        try {
            const { id, data } = event.detail;

            if ($adminMode) {
                try {
                    // Fetch latest categories to find the correct documentId
                    const allCategories = await getCategories();
                    const categoryToUpdate = allCategories.find((cat: Category) => cat.id === id);

                    if (!categoryToUpdate) {
                        throw new Error('Category not found');
                    }

                    // Get documentId or fall back to id
                    const documentId = categoryToUpdate.documentId || id;

                    // Send update to Strapi
                    await updateCategory(documentId, data);

                    // Update local state immediately for responsiveness
                    const updatedCategories = categories.map((cat) => {
                        if (cat.id === id) {
                            return {
                                ...cat,
                                attributes: {
                                    ...cat.attributes,
                                    ...data.data
                                }
                            };
                        }
                        return cat;
                    });

                    updateCategoriesAndRender(updatedCategories);

                    // Refresh from server to get complete updated data
                    try {
                        const refreshedCategories = await getCategories();
                        if (refreshedCategories && refreshedCategories.length > 0) {
                            updateCategoriesAndRender(refreshedCategories);
                        }
                    } catch (refreshError) {
                        // Already updated local state, so continue silently
                    }
                } catch (updateError: any) {
                    // Special handling for 404 errors (category not found)
                    if (
                        updateError.status === 404 ||
                        (typeof updateError.message === 'string' && updateError.message.includes('404'))
                    ) {
                        alert('Category not found. It may have been deleted from the server.');

                        // Try to refresh categories from server
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
                        // Handle other errors
                        alert(`Failed to update category: ${updateError.message || 'Unknown error'}`);
                    }
                    throw updateError; // Re-throw for the outer catch
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
                {#each categoryGrid.categories as category (category.id + '-' + categoryGrid.updateCounter)}
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
        </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog.Root bind:open={$showDeleteDialog}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Confirm Deletion</AlertDialog.Title>
                <AlertDialog.Description>
                    Are you sure you want to delete the category "{$categoryNameToDelete}"? All images belonging to this
                    category will also be deleted. <strong>This action cannot be undone.</strong>
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel on:click={cancelDelete}>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action on:click={confirmDeleteCategory}>Delete</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>

<style lang="scss">
    /* Global styles for basic page layout */
    :global(html, body) {
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
        font-family: 'Garamond Libre', serif;
    }
</style>
