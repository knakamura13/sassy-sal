<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    import { addCategory, deleteCategory, getCategories, updateCategory } from '$lib/services/sanityContentService';
    import { addDeletedCategory, deletedCategories } from '$lib/stores/deletedCategoriesStore';
    import { adminMode } from '$lib/stores/adminStore';
    import { AspectRatio } from '$lib/components/ui/aspect-ratio';
    import { showToast } from '$lib/utils';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Alert from '$lib/components/ui/alert';
    import * as Progress from '$lib/components/ui/progress';
    import CategoryCard from '$lib/components/category/CategoryCard.svelte';
    import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';

    // Interface for category data
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

    // Interface for formatted category data returned from the server
    interface FormattedCategory {
        id: string | number;
        documentId?: string;
        attributes: {
            name: string;
            order: number;
            description?: string;
            thumbnail: {
                data: {
                    attributes: {
                        url: string;
                    };
                };
            } | null;
            images?: {
                data: any[];
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

    // Flag to prevent multiple simultaneous category operations
    let isAddingCategory = false;

    // Alert dialog state
    let showDeleteDialog = writable(false);
    let categoryToDelete = writable<string | number | null>(null);
    let categoryNameToDelete = writable<string>('');

    // Progress dialog state
    let showProgressDialog = writable(false);
    let progressStep = writable(0);
    let progressTotal = writable(0);
    let progressMessage = writable('');
    let progressPercentage = writable(0);

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
                    }
                } catch (e) {}
            }

            // Check for full category data
            const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
            if (savedCategories && (!categories || categories.length === 0)) {
                try {
                    const parsedCategories = JSON.parse(savedCategories);
                    if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                        categories = parsedCategories;
                        updateCounter++;
                    }
                } catch (e) {}
            }
        } catch (e) {}
    });

    // Updates the categories state and forces component re-render
    function updateCategoriesAndRender(newCategories: Category[] | FormattedCategory[]) {
        // Deep copy to ensure reactivity when updating nested properties
        const categoriesCopy = JSON.parse(JSON.stringify(newCategories));
        categories = categoriesCopy as Category[];
        // Increment counter to trigger re-render
        updateCounter++;

        // Save to localStorage for persistence
        try {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));

            // Also save just the order mapping for easier access
            const orderMap: Record<string, number> = {};
            categories.forEach((cat) => {
                if (cat.id && cat.attributes && cat.attributes.order !== undefined) {
                    orderMap[String(cat.id)] = cat.attributes.order;
                }
            });
            localStorage.setItem(CATEGORIES_ORDER_KEY, JSON.stringify(orderMap));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    // Reactive statement: filter deleted categories and sort by order, then by name
    $: filteredCategories = categories
        .filter((cat) => !$deletedCategories.includes(cat.id))
        .sort((a, b) => {
            // Primary sort by order (ascending)
            // Make sure we're comparing numbers
            const orderA = a.attributes.order;
            const orderB = b.attributes.order;
            const orderDiff = orderA - orderB;

            if (orderDiff !== 0) return orderDiff;

            // Secondary sort by name for consistent ordering when order is the same
            return a.attributes.name.localeCompare(b.attributes.name);
        });

    // Reactive derived value for category grid that triggers re-renders
    $: categoryGrid = { categories: filteredCategories, updateCounter };

    // Set admin mode when the user is authenticated
    $: if (data.admin) {
        adminMode.set(true);
    } else {
        adminMode.set(false);
    }

    // Handles drag and drop reordering of categories
    async function handleDndConsider(e: CustomEvent<{ items: Array<Category & { id: string }> }>) {
        const { items } = e.detail;
        // We don't need to maintain a separate dndCategories variable
        // Just update the items in the event
    }

    // Handles when the user has completed a drag and drop operation
    async function handleDndFinalize(e: CustomEvent<{ items: Array<Category & { id: string }> }>) {
        const { items } = e.detail;

        // Prevent multiple reordering operations
        if (isReordering) return;
        isReordering = true;

        try {
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

            // Update orders in the backend
            if ($adminMode) {
                // First, try to get the latest categories from server, but fallback to local if server issues
                let serverCategories = [];
                let useLocalCategoriesAsBackup = false;
                try {
                    serverCategories = await getCategories();

                    // If we get an empty array when we expect categories, something went wrong
                    if (serverCategories.length === 0 && categories.length > 0) {
                        serverCategories = categories;
                        useLocalCategoriesAsBackup = true;
                    }
                } catch (error) {
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

                    // Find the matching server category
                    let serverCategory: FormattedCategory | Category | undefined;
                    if (useLocalCategoriesAsBackup) {
                        // Use local data if server fetch failed
                        serverCategory = categories.find((c) => String(c.id) === categoryId);
                    } else {
                        // Use server data if available
                        serverCategory = (serverCategories as any[]).find((c) => String(c.id) === categoryId);
                    }

                    if (serverCategory) {
                        const originalOrder = serverCategory.attributes.order;

                        // Only update if the order has changed
                        if (originalOrder !== newOrder) {
                            console.log();

                            try {
                                // Create a promise for this update
                                const updatePromise = updateCategory(String(serverCategory.id), {
                                    name: serverCategory.attributes.name,
                                    order: newOrder
                                })
                                    .then((result) => {
                                        console.log();
                                        return result;
                                    })
                                    .catch(() => {
                                        // Don't throw, just log the error - we've already updated locally
                                        return null;
                                    });

                                updatePromises.push(updatePromise);
                            } catch (error) {
                                console.error(error);
                            }
                        } else {
                            console.log();
                        }
                    } else {
                    }
                }

                if (updatePromises.length === 0) {
                    showToast.info('Categories reordered and saved locally');
                } else {
                    // Wait for all updates to complete
                    try {
                        await Promise.all(updatePromises);
                        showToast.success('Categories reordered and saved');
                    } catch (error) {
                        showToast.info('Categories reordered locally, but some server updates failed');
                    }

                    // Refresh categories from server after updates
                    try {
                        const refreshedCategories = await getCategories();

                        if (refreshedCategories && refreshedCategories.length > 0) {
                            // Combine server data with our local order
                            const combinedCategories = (refreshedCategories as any[]).map((serverCat) => {
                                // Find matching local category to get its order
                                const localCat = categories.find((c) => String(c.id) === String(serverCat.id));
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
                        // No need to show an error - we're still displaying the correct order locally
                    }
                }
            }
        } catch (error) {
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

        // Reset and show the progress dialog
        $progressStep = 0;
        $progressTotal = 0; // Set to 0 initially to indicate we don't know the count yet
        $progressMessage = 'Starting category deletion...';
        $progressPercentage = 0;
        $showProgressDialog = true;
        // Hide the delete confirmation dialog
        $showDeleteDialog = false;

        try {
            if ($adminMode) {
                try {
                    // Fetch latest categories to find the correct id
                    const allCategories = await getCategories();
                    const categoryToDelete = (allCategories as any[]).find((cat) => {
                        return `${cat.id}` === `${id}`;
                    });

                    if (!categoryToDelete) {
                        throw new Error('Category not found');
                    }

                    // Use the category id (ensure it's a string for Sanity)
                    const categoryId = String(id);

                    // Progress callback function to update UI
                    const updateProgress = (step: number, total: number, message: string) => {
                        $progressStep = step;
                        $progressTotal = total;
                        $progressMessage = message;
                        $progressPercentage = Math.round((step / total) * 100);
                    };

                    // Delete from Sanity backend with progress updates
                    await deleteCategory(categoryId, updateProgress);

                    // Keep progress dialog visible for a moment so user can see completion
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Hide the progress dialog
                    $showProgressDialog = false;

                    // Refresh category list from server after deletion
                    try {
                        const updatedCategories = await getCategories();

                        // If category still exists in response, track it as deleted locally
                        const categoryStillExists = (updatedCategories as any[]).some((cat) => cat.id === id);
                        if (categoryStillExists) {
                            addDeletedCategory(id);
                        }
                        updateCategoriesAndRender(updatedCategories);

                        // Successful deletion toast
                        showToast.success('Category and all associated images deleted successfully');
                    } catch (fetchError) {
                        // If server refresh fails, update local state and mark as deleted
                        addDeletedCategory(id);
                        const filteredCategories = categories.filter((cat) => cat.id !== id);
                        updateCategoriesAndRender(filteredCategories);
                        showToast.info('Category deleted, but there was an error refreshing the category list.');
                    }
                } catch (deleteError: any) {
                    // Hide the progress dialog in case of error
                    $showProgressDialog = false;

                    // Special handling for reference constraint errors
                    if (
                        typeof deleteError.message === 'string' &&
                        (deleteError.message.includes('references to it') ||
                            deleteError.message.includes('cannot be deleted as there are references'))
                    ) {
                        showToast.error(
                            'Error: Some images could not be automatically deleted. Please try again or delete the images manually first.'
                        );
                        console.error('Reference constraint error:', deleteError);
                    }
                    // Special handling for 404 errors (category not found)
                    else if (
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
            // Hide the progress dialog in case of error
            $showProgressDialog = false;

            console.error('Error removing category:', error);
            showToast.error('Failed to delete category');
        } finally {
            // Reset alert dialog state
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
    async function handleAddCategory(event: CustomEvent) {
        // Prevent multiple simultaneous operations
        if (isAddingCategory) return;
        isAddingCategory = true;

        try {
            const newCategory = event.detail;
            console.log('Adding new category:', newCategory);

            if (!$adminMode) {
                isAddingCategory = false;
                return;
            }

            // Create a temporary local category with unique ID
            const tempId = `temp-${Date.now()}`;
            const tempCategory: Category = {
                id: tempId,
                attributes: {
                    name: newCategory.name,
                    order: newCategory.order,
                    description: '',
                    thumbnail: newCategory.thumbnail
                        ? {
                              data: {
                                  attributes: {
                                      url: URL.createObjectURL(newCategory.thumbnail)
                                  }
                              }
                          }
                        : undefined
                }
            };

            console.log('Created temporary category with ID:', tempId);

            // Add temporary category to the UI immediately
            categories = [...categories, tempCategory];
            updateCounter++; // Force re-render

            try {
                // Now save to server
                console.log('Saving category to Sanity...');
                const response = await addCategory(newCategory);
                const savedCategory = (response as any)?.data ? (response as any).data : response;
                console.log('Category saved to Sanity:', savedCategory);

                // Wait for the save to complete
                await new Promise((resolve) => setTimeout(resolve, 500));

                // After successful save, replace the temporary category with the real one
                categories = categories.map((cat) => {
                    if (cat.id === tempId) {
                        console.log(`Replacing temp category ${tempId} with saved category ${savedCategory.id}`);
                        return savedCategory;
                    }
                    return cat;
                });

                // Force re-render after replacement
                updateCounter++;

                // Save to localStorage
                try {
                    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
                    const orderMap: Record<string, number> = {};
                    categories.forEach((cat) => {
                        if (cat.id && cat.attributes && cat.attributes.order !== undefined) {
                            orderMap[String(cat.id)] = cat.attributes.order;
                        }
                    });
                    localStorage.setItem(CATEGORIES_ORDER_KEY, JSON.stringify(orderMap));
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }

                showToast.success('Category added successfully');
            } catch (error) {
                console.error('Error saving to Sanity:', error);
                showToast.error("Failed to save category to server, but it's displayed locally");
                // Keep the temp category visible as a fallback
            }
        } catch (error) {
            console.error('Error in handleAddCategory:', error);
            showToast.error('Failed to add category');

            // Remove any temporary categories if there was a critical error
            categories = categories.filter((cat) => !String(cat.id).startsWith('temp-'));
            updateCounter++; // Force re-render
        } finally {
            isAddingCategory = false;
        }
    }

    // Handles updating an existing category
    async function handleUpdateCategory(event: CustomEvent) {
        try {
            const { id, data } = event.detail;

            if ($adminMode) {
                try {
                    // Fetch latest categories to find the category
                    const allCategories = await getCategories();
                    const categoryToUpdate = (allCategories as any[]).find((cat) => {
                        return `${cat.id}` === `${id}`;
                    });

                    if (!categoryToUpdate) {
                        throw new Error('Category not found');
                    }

                    // Use the category id (ensure it's a string for Sanity)
                    const categoryId = String(id);

                    // Send update to Sanity
                    const _ = await updateCategory(categoryId, data);

                    // Update local state immediately for responsiveness
                    const updatedCategories = categories.map((cat) => {
                        if (cat.id === id) {
                            return {
                                ...cat,
                                attributes: {
                                    ...cat.attributes,
                                    ...(data.data || {})
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
                            // Find the updated category to check its thumbnail
                            const updatedCategory = (refreshedCategories as any[]).find(
                                (cat) => String(cat.id) === String(id)
                            );

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
                                categories = updatedCategories as Category[];
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
</script>

<svelte:head>
    <title>SallyJK Photography</title>
</svelte:head>

<div class="page min-h-[100vh] !px-[6vw] !pb-[240px] !pt-[60px]" id="home">
    {#if $adminMode}
        <!-- Draggable category grid for admin mode -->
        <div
            class="grid auto-rows-min grid-cols-1 gap-10 md:grid-cols-2 lg:gap-20"
            use:dndzone={{
                items: filteredCategories.map((category) => ({
                    ...category,
                    id: String(category.id)
                })),
                flipDurationMs: 300,
                type: 'categories'
            }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
        >
            {#each filteredCategories as category (String(category.id) + '-' + updateCounter)}
                <div class="category-item">
                    <AspectRatio ratio={3 / 4} class="!m-auto !aspect-[3/4] max-h-[770px] bg-muted">
                        <CategoryCard
                            {category}
                            isAdmin={$adminMode}
                            on:remove={handleRemoveCategory}
                            on:update={handleUpdateCategory}
                        />
                    </AspectRatio>
                </div>
            {/each}

            <CategoryUploadPlaceholder on:addCategory={handleAddCategory} />
        </div>
    {:else}
        <!-- Regular non-draggable grid for non-admin mode -->
        <div class="grid auto-rows-min grid-cols-1 gap-10 md:grid-cols-2 lg:gap-20">
            {#each categoryGrid.categories as category (category.id + '-' + categoryGrid.updateCounter)}
                <AspectRatio ratio={3 / 4} class="!m-auto !aspect-[3/4] max-h-[770px] bg-muted">
                    <CategoryCard
                        {category}
                        isAdmin={$adminMode}
                        on:remove={handleRemoveCategory}
                        on:update={handleUpdateCategory}
                    />
                </AspectRatio>
            {/each}
        </div>
    {/if}
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={$showDeleteDialog}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Confirm Deletion</AlertDialog.Title>
            <AlertDialog.Description>
                Are you sure you want to delete the category "{$categoryNameToDelete}"? All images belonging to this
                category will also be deleted. <strong>This action cannot be undone.</strong>

                <p class="mt-2 text-sm text-muted-foreground">
                    The system will attempt to delete all associated images first, then the category itself.
                </p>
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel on:click={cancelDelete}>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action on:click={confirmDeleteCategory}>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Progress Dialog -->
<AlertDialog.Root bind:open={$showProgressDialog}>
    <AlertDialog.Content class="sm:max-w-md">
        <AlertDialog.Header>
            <AlertDialog.Title>Deleting Category</AlertDialog.Title>
            <AlertDialog.Description>
                <div class="space-y-4">
                    <Alert.Alert>
                        <Alert.AlertDescription>
                            {$progressMessage}
                        </Alert.AlertDescription>
                    </Alert.Alert>

                    <div class="flex flex-col space-y-1.5">
                        <div class="flex justify-between text-sm font-medium">
                            <span>Progress</span>
                            {#if $progressTotal > 0}
                                <span>{$progressStep} of {$progressTotal} steps</span>
                            {/if}
                        </div>
                        <Progress.Progress value={$progressPercentage} class="h-2" />
                        <div class="mt-1 text-center text-sm text-muted-foreground">
                            {$progressPercentage}%
                        </div>
                    </div>
                </div>
            </AlertDialog.Description>
        </AlertDialog.Header>
    </AlertDialog.Content>
</AlertDialog.Root>

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
</style>
