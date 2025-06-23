<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import CategoryNavigation from './CategoryNavigation.svelte';

    // Props
    export let categoryId: string = '';
    export let categoryOrder: number | undefined = undefined;

    // Event dispatcher
    const dispatch = createEventDispatcher();

    // Next category navigation state
    let nextCategory: { id: string; name: string } | null = null;
    let isLoadingNextCategory = false;

    // Fetch next category on mount if we have the required data
    onMount(() => {
        if (categoryId && categoryOrder !== undefined) {
            fetchNextCategory();
        }
    });

    // Fetch the next category based on current category order
    async function fetchNextCategory() {
        if (!categoryId || categoryOrder === undefined || isLoadingNextCategory) return;

        isLoadingNextCategory = true;
        try {
            // Import Sanity helper to get all categories
            const { getAllCategories } = await import('$lib/services/sanityHelpers');
            const categories = await getAllCategories();

            if (categories.length <= 1) {
                return;
            }

            // Sort categories by order to ensure correct sequence
            const sortedCategories = [...categories].sort(
                (a, b) => (a.attributes.order || 0) - (b.attributes.order || 0)
            );

            // Find the category with the next highest order
            const nextCat = sortedCategories.find(
                (cat) => (cat.attributes.order || 0) > (categoryOrder || 0) && cat.id !== categoryId
            );

            // If we've found a next category, use it
            if (nextCat) {
                nextCategory = {
                    id: nextCat.id,
                    name: nextCat.attributes.name
                };
            } else {
                // If there's no next category (we're at the last one),
                // get the first category (lowest order)
                const firstCategory = sortedCategories[0];
                if (firstCategory && firstCategory.id !== categoryId) {
                    nextCategory = {
                        id: firstCategory.id,
                        name: firstCategory.attributes.name
                    };
                }
            }

            // Dispatch the next category data to parent
            dispatch('nextCategoryFound', nextCategory);
        } catch (error) {
            console.error('Error fetching next category:', error);
            dispatch('error', error);
        } finally {
            isLoadingNextCategory = false;
        }
    }

    // Expose refetch function for parent components
    export function refetchNextCategory() {
        fetchNextCategory();
    }
</script>

<CategoryNavigation {nextCategory} />
