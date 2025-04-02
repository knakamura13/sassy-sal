<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Category } from '$lib/stores/categoryStore';

    export let category: Category;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher();

    function handleRemove() {
        dispatch('remove', category.id);
    }

    function handleEdit() {
        // This would open an edit form in a real application
        const newName = prompt('Enter new category name:', category.name);
        if (newName && newName.trim() !== '') {
            category.name = newName.trim();
            // In a real app, this would update the store
        }
    }
</script>

<a
    href={isAdmin ? `/${category.slug}?admin=true` : `/${category.slug}`}
    class="category-card !m-0 block transition-all duration-200 overflow-hidden rounded-lg shadow-md hover:shadow-lg"
>
    <div class="aspect-square w-full relative">
        <img src={category.imageUrl} alt={category.name} class="w-full h-full object-cover" />

        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 text-white">
            <h3 class="text-xl font-medium">{category.name}</h3>
            {#if category.description}
                <p class="text-sm mt-1 text-gray-200">{category.description}</p>
            {/if}
        </div>

        {#if isAdmin}
            <div class="absolute top-2 right-2 flex space-x-2">
                <button
                    class="bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    class="bg-gray-800 bg-opacity-70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none shadow-md"
                    on:click|stopPropagation|preventDefault={handleRemove}
                    aria-label="Remove category"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</a>
