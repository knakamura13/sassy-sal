<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';

    export let image: Image;
    export let isAdmin: boolean = false;
    export let isCategory: boolean = false;

    const dispatch = createEventDispatcher();

    function handleRemove() {
        dispatch('remove', image.id);
    }
</script>

<div class="image-card-wrapper aspect-square w-full relative !m-auto">
    <div
        class="image-card transition-all duration-200 inset-0 relative overflow-hidden shadow-md w-full h-full hover:transform hover:scale-[1.01] cursor-pointer"
        data-image-id={image.id}
        data-has-url={!!image.url}
    >
        {#if image.url}
            <img src={image.url} alt={image.alt} class="w-full h-full object-cover" />
        {:else}
            <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                <p class="text-gray-500 text-sm p-2 text-center">
                    {image.title || 'Untitled'}<br />
                    <span class="text-xs">(Image URL missing)</span>
                </p>
            </div>
        {/if}

        {#if image.title && !isCategory}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                <h3 class="text-sm md:text-base font-medium">{image.title}</h3>
            </div>
        {/if}

        {#if isAdmin}
            <button
                class="absolute !m-0 top-2 right-2 bg-gray-800 bg-opacity-0 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 shadow-md hover:shadow-lg focus:outline-none transition-all duration-200"
                on:click|stopPropagation={handleRemove}
                aria-label="Remove image"
            >
                ×
            </button>
        {/if}
    </div>
</div>
