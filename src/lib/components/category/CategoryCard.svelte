<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { getRandomImageByQuery } from '$lib/services/unsplash';

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

    // State for image URL (will be populated from Unsplash if missing)
    let imageUrl = '';
    let isLoading = true;

    onMount(async () => {
        await loadImage();
    });

    // Function to load image from thumbnail or Unsplash
    async function loadImage() {
        isLoading = true;

        if (category.attributes.thumbnail?.data?.attributes?.url) {
            imageUrl = category.attributes.thumbnail.data.attributes.url;
        } else {
            // If no thumbnail, get a random image from Unsplash or Picsum based on category name
            imageUrl = await getRandomImageByQuery(category.attributes.name);
        }

        isLoading = false;
    }

    function handleRemove() {
        dispatch('remove', category.id);
    }

    function handleEdit() {
        const newName = prompt('Enter new category name:', category.attributes.name);
        if (newName && newName.trim() !== '') {
            category.attributes.name = newName.trim();
        }
    }
</script>

<a
    href={isAdmin ? `/${category.attributes.name}?admin=true` : `/${category.attributes.name}`}
    class="category-card aspect-[3/4] min-w-[240px] max-w-[320px] w-full !m-auto block transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1 relative h-full"
>
    <div
        class="category-card-border absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
    ></div>
    <div class="w-full h-full relative">
        {#if !isLoading}
            <div class="w-full h-full transition-all duration-300 hover:brightness-110 hover:contrast-[1.05]">
                <img
                    src={imageUrl}
                    alt={category.attributes.name}
                    class="w-full h-full object-cover image-filter transition-[filter] duration-300 ease-out"
                />
            </div>
        {/if}

        <div class="absolute inset-0 flex items-center justify-center">
            <h3
                class="card-title font-didot text-2xl transition-all duration-300 text-white text-center px-4 py-10 w-full backdrop-blur-sm bg-black bg-opacity-30 shadow-text"
            >
                {category.attributes.name}
            </h3>
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

<style lang="scss">
    .image-filter {
        filter: sepia(0.2) brightness(0.92) saturate(0.85);
    }

    .shadow-text {
        text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.8);
    }

    .category-card:hover {
        .card-title {
            opacity: 1;
            transform: scale(1.1);
            background-color: rgba(0, 0, 0, 0.5);
        }
        .category-card-border {
            opacity: 1;
        }
        .image-filter {
            filter: sepia(0) brightness(1) saturate(1.1);
        }
    }
</style>
