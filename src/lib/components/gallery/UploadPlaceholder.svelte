<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';
    import NewImagesDialog from './NewImagesDialog.svelte';

    export let categoryId: string = '';

    const dispatch = createEventDispatcher<{ addImages: Image[] }>();

    let open = false;

    function handleAddImages(event: CustomEvent<Image[]>) {
        dispatch('addImages', event.detail);
    }
</script>

<div class="upload-placeholder w-full">
    <button
        type="button"
        class="flex w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-gray-300 py-16 transition-colors hover:bg-gray-50"
        on:click={() => (open = true)}
    >
        <span class="mb-2 text-3xl text-gray-500">+</span>
        <span class="font-medium text-gray-500">Add Images</span>
    </button>

    <NewImagesDialog bind:open {categoryId} on:addImages={handleAddImages} />
</div>
