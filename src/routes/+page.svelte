<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    import {
        addCategory,
        addCategoryFast,
        uploadCategoryThumbnail,
        deleteCategory
    } from '$lib/services/sanity/categoryService';
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
            passwordProtected?: boolean;
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
            passwordProtected?: boolean;
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
                    const response1 = await fetch('/api/categories');
                    const rawCategories1 = response1.ok ? await response1.json() : [];
                    const allCategories = rawCategories1.map((cat: any) => ({
                        id: cat._id,
                        attributes: { name: cat.name, order: cat.order }
                    }));
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
                        const response2 = await fetch('/api/categories');
                        const rawCategories2 = response2.ok ? await response2.json() : [];
                        const updatedCategories = rawCategories2.map((cat: any) => ({
                            id: cat._id,
                            attributes: {
                                name: cat.name,
                                order: cat.order,
                                thumbnail: cat.thumbnail,
                                passwordProtected: cat.passwordProtected
                            }
                        }));

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
                            const response2 = await fetch('/api/categories');
                            const rawCategories2 = response2.ok ? await response2.json() : [];
                            const updatedCategories = rawCategories2.map((cat: any) => ({
                                id: cat._id,
                                attributes: {
                                    name: cat.name,
                                    order: cat.order,
                                    thumbnail: cat.thumbnail,
                                    passwordProtected: cat.passwordProtected
                                }
                            }));
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

    // Handles adding a new category with fast creation (decoupled thumbnail upload)
    async function handleAddCategoryFast(event: CustomEvent) {
        // Prevent multiple simultaneous operations
        if (isAddingCategory) return;
        isAddingCategory = true;

        try {
            const { categoryData, thumbnailFile, thumbnailPreview } = event.detail;

            if (!$adminMode) {
                isAddingCategory = false;
                return;
            }

            // Create a stable blob URL from the file for optimistic rendering
            let optimisticThumbnailUrl = thumbnailPreview;
            if (thumbnailFile && !thumbnailPreview) {
                optimisticThumbnailUrl = URL.createObjectURL(thumbnailFile);
            }

            // Create a temporary local category with unique ID and optimistic thumbnail
            const tempId = `temp-${Date.now()}`;
            const tempCategory: Category = {
                id: tempId,
                attributes: {
                    name: categoryData.name,
                    order: categoryData.order,
                    description: '',
                    thumbnail: optimisticThumbnailUrl
                        ? {
                              data: {
                                  attributes: {
                                      url: optimisticThumbnailUrl
                                  }
                              }
                          }
                        : undefined
                }
            };

            // Add temporary category to the UI immediately for instant feedback
            categories = [...categories, tempCategory];
            updateCounter++; // Force re-render

            try {
                // Step 1: Create category without thumbnail (fast)
                const response = await addCategoryFast(categoryData);
                const savedCategory = (response as any)?.data ? (response as any).data : response;

                // Replace the temporary category with the real one immediately
                categories = categories.map((cat) => {
                    if (cat.id === tempId) {
                        return {
                            ...savedCategory,
                            attributes: {
                                ...savedCategory.attributes,
                                // Keep the optimistic thumbnail until upload completes
                                thumbnail: optimisticThumbnailUrl
                                    ? {
                                          data: {
                                              attributes: {
                                                  url: optimisticThumbnailUrl
                                              }
                                          }
                                      }
                                    : savedCategory.attributes.thumbnail
                            }
                        };
                    }
                    return cat;
                });
                updateCounter++;

                // Show success immediately
                showToast.success('Category created successfully!');

                // Step 2: Upload thumbnail in background if provided
                if (thumbnailFile && savedCategory.id) {
                    // Don't await this - let it happen in the background
                    uploadCategoryThumbnail(String(savedCategory.id), thumbnailFile)
                        .then((thumbnailResponse) => {
                            const updatedCategory = (thumbnailResponse as any)?.data
                                ? (thumbnailResponse as any).data
                                : thumbnailResponse;

                            // Update the category with the real thumbnail
                            categories = categories.map((cat) => {
                                if (cat.id === savedCategory.id) {
                                    return updatedCategory;
                                }
                                return cat;
                            });
                            updateCounter++;

                            // Clean up the blob URL now that we have the real thumbnail
                            if (optimisticThumbnailUrl && optimisticThumbnailUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(optimisticThumbnailUrl);
                            }

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

                            console.log('Thumbnail uploaded successfully');
                        })
                        .catch((error) => {
                            console.error('Error uploading thumbnail:', error);
                            showToast.error('Category created but thumbnail upload failed');

                            // Clean up the blob URL on error too
                            if (optimisticThumbnailUrl && optimisticThumbnailUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(optimisticThumbnailUrl);
                            }
                        });
                } else {
                    // No thumbnail to upload, save to localStorage now
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
                }
            } catch (error) {
                console.error('Error saving category to Sanity:', error);
                showToast.error('Failed to create category');

                // Remove the temporary category on error
                categories = categories.filter((cat) => cat.id !== tempId);
                updateCounter++;
            }
        } catch (error) {
            console.error('Error in handleAddCategoryFast:', error);
            showToast.error('Failed to add category');

            // Remove any temporary categories if there was a critical error
            categories = categories.filter((cat) => !String(cat.id).startsWith('temp-'));
            updateCounter++; // Force re-render
        } finally {
            isAddingCategory = false;
        }
    }

    // Handles adding a new category (legacy method with synchronous thumbnail upload)
    async function handleAddCategory(event: CustomEvent) {
        // Prevent multiple simultaneous operations
        if (isAddingCategory) return;
        isAddingCategory = true;

        try {
            const newCategory = event.detail;

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

            // Add temporary category to the UI immediately
            categories = [...categories, tempCategory];
            updateCounter++; // Force re-render

            try {
                // Now save to server
                const response = await addCategory(newCategory);
                const savedCategory = (response as any)?.data ? (response as any).data : response;

                // Wait for the save to complete
                await new Promise((resolve) => setTimeout(resolve, 500));

                // After successful save, replace the temporary category with the real one
                categories = categories.map((cat) => {
                    if (cat.id === tempId) {
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
                    // Call our server-side API endpoint instead of the client-side Sanity service
                    const response = await fetch(`/api/categories/${id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }

                    const result = await response.json();

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
                        const response = await fetch('/api/categories');
                        const rawCategories = response.ok ? await response.json() : [];
                        const refreshedCategories = rawCategories.map((cat: any) => ({
                            id: cat._id,
                            attributes: {
                                name: cat.name,
                                order: cat.order,
                                thumbnail: cat.thumbnail,
                                passwordProtected: cat.passwordProtected
                            }
                        }));
                        if (refreshedCategories && refreshedCategories.length > 0) {
                            updateCategoriesAndRender(refreshedCategories);
                        }
                    } catch (refreshError) {
                        // Already updated local state, so continue silently
                        console.warn('[DEBUG] Failed to refresh categories after update:', refreshError);
                    }

                    showToast.success('Category updated successfully');
                } catch (updateError: any) {
                    console.error('[DEBUG] Error updating category via API:', updateError);

                    // Special handling for 404 errors (category not found)
                    if (
                        updateError.status === 404 ||
                        (typeof updateError.message === 'string' && updateError.message.includes('404'))
                    ) {
                        showToast.error('Category not found. It may have been deleted from the server.');

                        // Try to refresh categories from server
                        try {
                            const response2 = await fetch('/api/categories');
                            const rawCategories2 = response2.ok ? await response2.json() : [];
                            const updatedCategories = rawCategories2.map((cat: any) => ({
                                id: cat._id,
                                attributes: {
                                    name: cat.name,
                                    order: cat.order,
                                    thumbnail: cat.thumbnail,
                                    passwordProtected: cat.passwordProtected
                                }
                            }));
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

<div class="page mx-auto min-h-[100vh] max-w-[1400px] !pb-[240px] !pt-[60px]" id="home">
    {#if $adminMode}
        <!-- Admin category grid -->
        <div class="grid auto-rows-min grid-cols-1 gap-8 md:grid-cols-2">
            {#each filteredCategories as category (String(category.id) + '-' + updateCounter)}
                <AspectRatio ratio={3 / 4} class="!aspect-[3/4] bg-muted">
                    <CategoryCard
                        {category}
                        isAdmin={$adminMode}
                        on:remove={handleRemoveCategory}
                        on:update={handleUpdateCategory}
                    />
                </AspectRatio>
            {/each}

            <CategoryUploadPlaceholder on:addCategory={handleAddCategory} on:addCategoryFast={handleAddCategoryFast} />
        </div>
    {:else}
        <!-- Regular non-draggable grid for non-admin mode -->
        <div class="grid auto-rows-min grid-cols-1 gap-8 md:grid-cols-2">
            {#each categoryGrid.categories as category (category.id + '-' + categoryGrid.updateCounter)}
                <AspectRatio ratio={3 / 4} class="!aspect-[3/4] bg-muted">
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
</style>
