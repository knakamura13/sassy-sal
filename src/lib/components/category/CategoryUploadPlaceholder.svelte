<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Category } from '$lib/stores/categoryStore';
    import { v4 as uuidv4 } from 'uuid';

    const dispatch = createEventDispatcher<{ addCategory: Category }>();

    let showForm = false;
    let categoryName = '';
    let categoryDescription = '';
    let categoryImageUrl = 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb';

    function resetForm() {
        showForm = false;
        categoryName = '';
        categoryDescription = '';
        categoryImageUrl = 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb';
    }

    function handleSubmit() {
        if (!categoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        // Create a new category with a unique ID and slug
        const slug = categoryName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
        const newCategory: Category = {
            id: uuidv4(),
            slug,
            name: categoryName.trim(),
            imageUrl: categoryImageUrl,
            description: categoryDescription.trim() || undefined
        };

        dispatch('addCategory', newCategory);
        resetForm();
    }
</script>

<div class="category-upload-placeholder aspect-square w-full">
    {#if showForm}
        <div class="h-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col">
            <h3 class="text-lg font-medium mb-4">Add New Category</h3>

            <div class="mb-3">
                <label class="block text-sm font-medium mb-1" for="categoryName">Category Name*</label>
                <input
                    type="text"
                    id="categoryName"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={categoryName}
                    placeholder="e.g. Weddings"
                    required
                />
            </div>

            <div class="mb-3">
                <label class="block text-sm font-medium mb-1" for="categoryDescription">Description</label>
                <input
                    type="text"
                    id="categoryDescription"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={categoryDescription}
                    placeholder="Short description (optional)"
                />
            </div>

            <div class="mb-3">
                <label class="block text-sm font-medium mb-1" for="categoryImageUrl">Image URL</label>
                <input
                    type="text"
                    id="categoryImageUrl"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    bind:value={categoryImageUrl}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div class="mt-auto flex space-x-2">
                <button
                    class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    on:click={handleSubmit}
                >
                    Add Category
                </button>
                <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded" on:click={resetForm}>
                    Cancel
                </button>
            </div>
        </div>
    {:else}
        <button
            class="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors"
            on:click={() => (showForm = true)}
        >
            <div class="text-5xl text-gray-400 mb-2">+</div>
            <div class="text-gray-500 font-medium">Add Category</div>
        </button>
    {/if}
</div>
