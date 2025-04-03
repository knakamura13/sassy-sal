<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    // Define Strapi Category type locally
    interface StrapiCategory {
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

    export let category: StrapiCategory;
    export let isAdmin: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
    }>();

    function handleRemove() {
        dispatch('remove', category.id);
    }

    function handleEdit() {
        // This would open an edit form in a real application
        const newName = prompt('Enter new category name:', category.attributes.name);
        if (newName && newName.trim() !== '') {
            category.attributes.name = newName.trim();
            // In a real app, this would update Strapi
        }
    }

    // Helper to get image URL with fallback
    function getImageUrl() {
        if (category.attributes.thumbnail?.data?.attributes?.url) {
            return category.attributes.thumbnail.data.attributes.url;
        }
        // Fallback image if no thumbnail
        return 'https://via.placeholder.com/300x300?text=No+Image';
    }
</script>

<a
    href={isAdmin ? `/${category.attributes.slug}?admin=true` : `/${category.attributes.slug}`}
    class="category-card !m-0 block transition-all duration-200 overflow-hidden rounded-lg shadow-md hover:shadow-lg"
>
    <div class="aspect-square w-full relative">
        <img src={getImageUrl()} alt={category.attributes.name} class="w-full h-full object-cover" />

        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-3 text-white">
            <h3 class="text-xl font-medium">{category.attributes.name}</h3>
            {#if category.attributes.description}
                <p class="text-sm mt-1 text-gray-200">{category.attributes.description}</p>
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
