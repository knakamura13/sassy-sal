<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';
    import { addCategory, deleteCategory, getCategories, updateCategory } from '$lib/services/strapi';
    import { addDeletedCategory, deletedCategories } from '$lib/stores/deletedCategoriesStore';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import { writable } from 'svelte/store';
    import { showToast } from '$lib/utils';
    import { dndzone } from 'svelte-dnd-action';
    import { onMount } from 'svelte';

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

    // LocalStorage keys
    const CATEGORIES_STORAGE_KEY = 'sassy-sal-categories';
    const CATEGORIES_ORDER_KEY = 'sassy-sal-categories-order';

    // Working copy of categories that maintains current state
    let categories = data.categories || [];

    // Counter to force component re-renders when category data changes
    let updateCounter = 0;

    // Alert dialog state
    let showDeleteDialog = writable(false);
    let categoryToDelete = writable<string | number | null>(null);
    let categoryNameToDelete = writable<string>('');

    // Flag to check if categories are currently being reordered
    let isReordering = false;

    // On component mount, try to load categories from localStorage if available
    onMount(() => {
        try {
            // First check if we have order overrides
            const savedOrder = localStorage.getItem(CATEGORIES_ORDER_KEY);
            if (savedOrder) {
                try {
                    const orderMap = JSON.parse(savedOrder);
                    console.log('[DEBUG] Found saved category order in localStorage:', orderMap);

                    // Apply saved order to our categories
                    if (categories && categories.length > 0) {
                        categories = categories.map((cat) => {
                            // If we have an override for this category ID, use it
                            if (orderMap[cat.id] !== undefined) {
                                return {
                                    ...cat,
                                    attributes: {
                                        ...cat.attributes,
                                        order: orderMap[cat.id]
                                    }
                                };
                            }
                            return cat;
                        });

                        // Force re-render
                        updateCounter++;
                        console.log('[DEBUG] Applied saved order to categories');
                    }
                } catch (e) {
                    console.error('[DEBUG] Error parsing saved order:', e);
                }
            }

            // Check for full category data
            const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
            if (savedCategories && (!categories || categories.length === 0)) {
                try {
                    const parsedCategories = JSON.parse(savedCategories);
                    if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                        console.log('[DEBUG] Using cached categories from localStorage');
                        categories = parsedCategories;
                        updateCounter++;
                    }
                } catch (e) {
                    console.error('[DEBUG] Error parsing saved categories:', e);
                }
            }
        } catch (e) {
            console.error('[DEBUG] Error accessing localStorage:', e);
        }
    });

    // Updates the categories state and forces component re-render
    function updateCategoriesAndRender(newCategories: Category[]) {
        // Deep copy to ensure reactivity when updating nested properties
        const categoriesCopy = JSON.parse(JSON.stringify(newCategories));
        categories = categoriesCopy;
        // Increment counter to trigger re-render
        updateCounter++;

        // Save to localStorage for persistence
        try {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));

            // Also save just the order mapping for easier access
            const orderMap: Record<string, number> = {};
            categories.forEach((cat) => {
                orderMap[String(cat.id)] = cat.attributes.order;
            });
            localStorage.setItem(CATEGORIES_ORDER_KEY, JSON.stringify(orderMap));
            console.log('[DEBUG] Saved categories to localStorage');
        } catch (e) {
            console.error('[DEBUG] Error saving to localStorage:', e);
        }
    }

    // Reactive statement: filter deleted categories and sort by order, then by name
    $: filteredCategories = categories
        .filter((cat) => !$deletedCategories.includes(cat.id))
        .sort((a, b) => {
            // Primary sort by order (ascending)
            // Make sure we're comparing numbers
            const orderA = typeof a.attributes.order === 'number' ? a.attributes.order : 0;
            const orderB = typeof b.attributes.order === 'number' ? b.attributes.order : 0;
            const orderDiff = orderA - orderB;

            if (orderDiff !== 0) return orderDiff;

            // Secondary sort by name for consistent ordering when order is the same
            return a.attributes.name.localeCompare(b.attributes.name);
        });

    // Reactive derived value for category grid that triggers re-renders
    $: categoryGrid = { categories: filteredCategories, updateCounter };

    // Prepare categories for dndzone (add unique id property for tracking)
    $: dndCategories = filteredCategories.map((category) => ({
        ...category,
        // Add a stringified id property that dndzone can track
        id: String(category.id)
    }));

    // Set admin mode when URL parameter is present
    $: if (data.admin) {
        adminMode.set(true);
    }

    // Define interfaces for dnd event types
    interface DndEvent {
        detail: {
            items: Array<Category & { id: string }>;
        };
    }

    // Handles drag and drop reordering of categories
    async function handleDndConsider(e: DndEvent) {
        const { items } = e.detail;
        dndCategories = items;
    }

    // Handles when the user has completed a drag and drop operation
    async function handleDndFinalize(e: DndEvent) {
        const { items } = e.detail;

        // Prevent multiple reordering operations
        if (isReordering) return;
        isReordering = true;

        try {
            // Update the dndCategories to reflect the new order
            dndCategories = items;

            // Create updated categories with new order values
            const updatedCategories = items.map((item: Category & { id: string }, index: number) => {
                const category = { ...item };
                // Update the order attribute
                category.attributes.order = index;
                return category;
            });

            // Important: Update the local state immediately to prevent snapping back
            // This also saves to localStorage through updateCategoriesAndRender
            updateCategoriesAndRender(updatedCategories);
            console.log('[DEBUG] Local category order updated and saved to localStorage');

            // Update orders in the backend
            if ($adminMode) {
                console.log('[DEBUG] Starting category reordering updates to server...');

                // First, try to get the latest categories from server, but fallback to local if server issues
                let serverCategories = [];
                let useLocalCategoriesAsBackup = false;
                try {
                    serverCategories = await getCategories();
                    console.log('[DEBUG] Fetched server categories for update:', serverCategories);

                    // If we get an empty array when we expect categories, something went wrong
                    if (serverCategories.length === 0 && categories.length > 0) {
                        console.warn('[DEBUG] Server returned empty categories, falling back to local data');
                        serverCategories = categories;
                        useLocalCategoriesAsBackup = true;
                    }
                } catch (error) {
                    console.error('[DEBUG] Failed to fetch server categories:', error);
                    showToast.info('Could not connect to server. Changes have been saved locally.');
                    serverCategories = categories;
                    useLocalCategoriesAsBackup = true;
                }

                // Get the category data from the server response (which includes IDs)
                const updatePromises = [];

                // Loop through our updatedCategories and update them on the server
                for (let i = 0; i < updatedCategories.length; i++) {
                    const category = updatedCategories[i];
                    const newOrder = i; // New order is just the index in the array

                    // Find the corresponding category in the server data
                    // Clean any string conversion issues with the ID
                    const categoryId = String(category.id).replace(/"/g, '');
                    console.log(`[DEBUG] Looking for category with ID "${categoryId}" in server data`);

                    // Find the matching server category
                    let serverCategory: Category | undefined;
                    if (useLocalCategoriesAsBackup) {
                        // Use local data if server fetch failed
                        serverCategory = categories.find((c: Category) => String(c.id) === categoryId);
                    } else {
                        // Use server data if available
                        serverCategory = serverCategories.find((c: Category) => String(c.id) === categoryId);
                    }

                    if (serverCategory) {
                        const originalOrder = serverCategory.attributes.order;

                        // Only update if the order has changed
                        if (originalOrder !== newOrder) {
                            console.log(
                                `[DEBUG] Updating category ID ${categoryId} order from ${originalOrder} to ${newOrder}`
                            );

                            try {
                                // Create a promise for this update
                                const updatePromise = updateCategory(serverCategory.id, {
                                    data: {
                                        order: newOrder
                                    }
                                })
                                    .then((result) => {
                                        console.log(
                                            `[DEBUG] Successfully updated category ID ${categoryId} order to ${newOrder}`
                                        );
                                        return result;
                                    })
                                    .catch((error) => {
                                        console.error(`[DEBUG] Error updating category ID ${categoryId}:`, error);
                                        // Don't throw, just log the error - we've already updated locally
                                        return null;
                                    });

                                updatePromises.push(updatePromise);
                            } catch (error) {
                                console.error(
                                    `[DEBUG] Error creating update promise for category ${categoryId}:`,
                                    error
                                );
                            }
                        } else {
                            console.log(
                                `[DEBUG] Category ID ${categoryId} order unchanged (${newOrder}), skipping update`
                            );
                        }
                    } else {
                        console.warn(`[DEBUG] Category ID ${categoryId} not found in server data, skipping update`);
                    }
                }

                if (updatePromises.length === 0) {
                    console.log('[DEBUG] No categories need server order updates');
                    showToast.info('Categories reordered and saved locally');
                } else {
                    console.log(`[DEBUG] Sending ${updatePromises.length} category updates to server...`);

                    // Wait for all updates to complete
                    try {
                        await Promise.all(updatePromises);
                        showToast.success('Categories reordered and saved');
                    } catch (error) {
                        console.error('[DEBUG] Error during server updates:', error);
                        showToast.info('Categories reordered locally, but some server updates failed');
                    }

                    // Refresh categories from server after updates
                    try {
                        console.log('[DEBUG] Refreshing categories from server after updates...');
                        const refreshedCategories = await getCategories();

                        if (refreshedCategories && refreshedCategories.length > 0) {
                            console.log('[DEBUG] Received refreshed categories:', refreshedCategories);

                            // Combine server data with our local order
                            const combinedCategories = refreshedCategories.map((serverCat: Category) => {
                                // Find matching local category to get its order
                                const localCat = categories.find(
                                    (c: Category) => String(c.id) === String(serverCat.id)
                                );
                                if (localCat) {
                                    return {
                                        ...serverCat,
                                        attributes: {
                                            ...serverCat.attributes,
                                            order: localCat.attributes.order
                                        }
                                    };
                                }
                                return serverCat;
                            });

                            // Update our local state with the combined data
                            updateCategoriesAndRender(combinedCategories);
                        }
                    } catch (error) {
                        console.error('[DEBUG] Error refreshing categories:', error);
                        // No need to show an error - we're still displaying the correct order locally
                    }
                }
            }
        } catch (error) {
            console.error('[DEBUG] Error reordering categories:', error);
            showToast.error('An error occurred during reordering, but changes were saved locally');
        } finally {
            isReordering = false;
        }
    }

    // Handles category deletion with confirmation
    async function handleRemoveCategory(event: CustomEvent<string | number>) {
        // Get category ID from the event
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
                try {
                    // Fetch latest categories to find the correct documentId
                    const allCategories = await getCategories();
                    const categoryToDelete = allCategories.find((cat: Category) => {
                        return `${cat.id}` === `${id}`;
                    });

                    if (!categoryToDelete) {
                        console.error(`[DEBUG] Category not found: id=${id}`);
                        throw new Error('Category not found');
                    }

                    // Get documentId or fall back to id
                    const documentId = categoryToDelete.documentId || id;
                    console.log(`[DEBUG] Deleting category: id=${id}, documentId=${documentId}`);

                    // Delete from Strapi backend in admin mode
                    await deleteCategory(documentId);

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
                        showToast.info('Category deleted, but there was an error refreshing the category list.');
                    }
                } catch (deleteError: any) {
                    // Special handling for 404 errors (category not found)
                    if (
                        deleteError.status === 404 ||
                        (typeof deleteError.message === 'string' && deleteError.message.includes('404'))
                    ) {
                        showToast.error('Category not found. It may have been deleted from the server.');

                        // Try to refresh categories from server
                        try {
                            const updatedCategories = await getCategories();
                            if (updatedCategories && updatedCategories.length > 0) {
                                updateCategoriesAndRender(updatedCategories);
                            }
                        } catch (refreshError) {
                            // If refresh fails, remove the category from local state
                            const filteredCategories = categories.filter((cat) => cat.id !== id);
                            updateCategoriesAndRender(filteredCategories);
                        }
                    } else {
                        // Handle other errors
                        console.error('Error removing category:', deleteError);
                        showToast.error(`Failed to delete category: ${deleteError.message || 'Unknown error'}`);
                        throw deleteError; // Re-throw for the outer catch
                    }
                }
            }
        } catch (error) {
            console.error('Error removing category:', error);
            showToast.error('Failed to delete category');
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
                        showToast.success('Category added successfully');
                        return;
                    }
                } catch (refreshError) {
                    // Silently continue if refresh fails
                }

                // Fallback: update local state with the saved category
                updateCategoriesAndRender([...categories, savedCategory]);
                showToast.success('Category added successfully');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast.error('Failed to add category');
        }
    }

    // Handles updating an existing category
    async function handleUpdateCategory(event: CustomEvent<any>) {
        try {
            const { id, data } = event.detail;
            console.log(`[DEBUG] Updating category: id=${id}, data=${JSON.stringify(data)}`);

            if ($adminMode) {
                try {
                    // Fetch latest categories to find the correct documentId
                    const allCategories = await getCategories();
                    console.log(`[DEBUG] All categories: ${JSON.stringify(allCategories)}`);
                    const categoryToUpdate = allCategories.find((cat: Category) => {
                        return `${cat.id}` === `${id}`;
                    });

                    if (!categoryToUpdate) {
                        console.error(`[DEBUG] Category not found: id=${id}`);
                        throw new Error('Category not found');
                    }

                    // Get documentId or fall back to id
                    const documentId = categoryToUpdate.documentId || id;
                    console.log(`Updating category: id=${id}, documentId=${documentId}`, data);

                    // Send update to Strapi
                    await updateCategory(documentId, data);

                    // Update local state immediately for responsiveness
                    const updatedCategories = categories.map((cat: Category) => {
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
                        showToast.error('Category not found. It may have been deleted from the server.');

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
                        showToast.error(`Failed to update category: ${updateError.message || 'Unknown error'}`);
                    }
                    throw updateError; // Re-throw for the outer catch
                }
            }
        } catch (error) {
            console.error('Error updating category:', error);
        }
    }

    // Handles refreshing categories
    async function refreshCategories() {
        try {
            console.log('[DEBUG] Refreshing categories...');
            const refreshedCategories = await getCategories();

            console.log('[DEBUG] Refresh result:', refreshedCategories);

            if (refreshedCategories && refreshedCategories.length > 0) {
                // Get current order from localStorage if available
                let orderMap: Record<string, number> = {};
                try {
                    const savedOrder = localStorage.getItem(CATEGORIES_ORDER_KEY);
                    if (savedOrder) {
                        orderMap = JSON.parse(savedOrder);
                        console.log('[DEBUG] Using saved order from localStorage:', orderMap);
                    }
                } catch (e) {
                    console.error('[DEBUG] Error reading saved order:', e);
                }

                // Apply order from localStorage or current state to refreshed data
                const orderedCategories = refreshedCategories.map((cat: Category) => {
                    const catId = String(cat.id);

                    // First check localStorage order
                    if (orderMap[catId] !== undefined) {
                        return {
                            ...cat,
                            attributes: {
                                ...cat.attributes,
                                order: orderMap[catId]
                            }
                        };
                    }

                    // Next check current state
                    const existingCat = categories.find((c: Category) => String(c.id) === catId);
                    if (existingCat) {
                        return {
                            ...cat,
                            attributes: {
                                ...cat.attributes,
                                order: existingCat.attributes.order
                            }
                        };
                    }

                    // Otherwise use server data
                    return cat;
                });

                // Use the dedicated function to update categories and re-render
                updateCategoriesAndRender(orderedCategories);
                showToast.success('Categories refreshed successfully');
            } else if (refreshedCategories && refreshedCategories.length === 0 && categories.length > 0) {
                // Server returned empty but we have categories locally - possible connection issue
                showToast.info('Could not refresh from server. Using local data.');
            } else {
                // Handle case where no categories were returned
                showToast.info('No categories received from server');
            }
        } catch (error: any) {
            // Type assertion to any to access .message
            console.error('[DEBUG] Error refreshing categories:', error);

            // Check for connection errors
            if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
                showToast.info('Could not connect to server. Using local data.');
            } else {
                showToast.error('Failed to refresh categories');
            }
        }
    }
</script>

<div class="page relative min-h-[100vh]" id="home">
    <div class="container mx-auto px-4">
        <div class="category-container py-6">
            {#if $adminMode}
                <!-- Draggable category grid for admin mode -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-6"
                    use:dndzone={{ items: dndCategories, flipDurationMs: 300, type: 'categories' }}
                    on:consider={handleDndConsider}
                    on:finalize={handleDndFinalize}
                >
                    {#each dndCategories as category (category.id)}
                        <div class="category-item">
                            <CategoryCard
                                {category}
                                isAdmin={$adminMode}
                                on:remove={handleRemoveCategory}
                                on:update={handleUpdateCategory}
                            />
                        </div>
                    {/each}

                    <CategoryUploadPlaceholder on:addCategory={handleAddCategory} />
                </div>
            {:else}
                <!-- Regular non-draggable grid for non-admin mode -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#each categoryGrid.categories as category (category.id + '-' + categoryGrid.updateCounter)}
                        <CategoryCard
                            {category}
                            isAdmin={$adminMode}
                            on:remove={handleRemoveCategory}
                            on:update={handleUpdateCategory}
                        />
                    {/each}
                </div>
            {/if}
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

    /* Style for draggable categories */
    :global(.category-item) {
        transition: transform 0.2s ease;
        cursor: move;
    }

    :global(.category-item:hover) {
        z-index: 10;
    }

    /* Styles for items being dragged */
    :global(.category-item.dndzone-drag-src) {
        opacity: 0.4;
    }

    :global(.category-item.dndzone-drag) {
        opacity: 1;
        transform: scale(1.05);
        z-index: 50;
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
</style>
