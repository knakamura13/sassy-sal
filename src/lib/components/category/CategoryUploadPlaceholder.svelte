<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    // Define the data structure that will be sent to Strapi
    interface CategoryData {
        data: {
            name: string;
            slug: string;
            description?: string;
        };
    }

    const dispatch = createEventDispatcher<{ addCategory: CategoryData }>();

    let showForm = false;
    let categoryName = '';
    let categoryDescription = '';
    let selectedFile: File | null = null;
    let imagePreview = '';

    function resetForm() {
        showForm = false;
        categoryName = '';
        categoryDescription = '';
        selectedFile = null;
        imagePreview = '';
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedFile = input.files[0];

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(selectedFile);
        }
    }

    function handleSubmit() {
        if (!categoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        // Create a slug from the category name
        const slug = categoryName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');

        // Prepare the data for Strapi
        const categoryData: CategoryData = {
            data: {
                name: categoryName.trim(),
                slug,
                description: categoryDescription.trim() || undefined
            }
        };

        // In a real implementation, we would upload the image file to Strapi
        // and assign it to the category. For now, we just pass the form data.
        dispatch('addCategory', categoryData);
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
                <label class="block text-sm font-medium mb-1" for="categoryImage">Thumbnail Image</label>
                <input
                    type="file"
                    id="categoryImage"
                    accept="image/*"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    on:change={handleFileChange}
                />
                {#if imagePreview}
                    <div class="mt-2 w-full h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        <img src={imagePreview} alt="Preview" class="h-full w-auto object-cover" />
                    </div>
                {/if}
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
