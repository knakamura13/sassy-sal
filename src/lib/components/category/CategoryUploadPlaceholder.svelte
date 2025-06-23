<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { AspectRatio } from '$lib/components/ui/aspect-ratio';
    import CategoryDialog from './CategoryDialog.svelte';

    // Define the data structure that will be sent to Sanity
    interface CategoryData {
        name: string;
        order: number;
        password?: string;
        thumbnail?: File;
    }

    const dispatch = createEventDispatcher<{ addCategory: CategoryData }>();

    // Dialog state
    let open = false;

    function handleAddCategory(event: CustomEvent<CategoryData>) {
        dispatch('addCategory', event.detail);
    }
</script>

<AspectRatio ratio={3 / 4} class="!aspect-[3/4] bg-muted">
    <div class="category-card block h-full w-full border-2 border-dashed border-gray-300 transition-all duration-300">
        <button
            type="button"
            class="flex h-full w-full cursor-pointer flex-col items-center justify-center p-4 transition-colors hover:bg-gray-100"
            on:click={() => (open = true)}
        >
            <span class="mb-2 text-3xl text-gray-500">+</span>
            <span class="font-medium text-gray-500">Add Category</span>
        </button>

        <CategoryDialog bind:open mode="create" on:addCategory={handleAddCategory} />
    </div>
</AspectRatio>
