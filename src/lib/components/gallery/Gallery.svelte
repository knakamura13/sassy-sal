<script lang="ts">
  import { imageStore, type Image } from '$lib/stores/imageStore';
  import { adminMode } from '$lib/stores/adminStore';
  import ImageCard from './ImageCard.svelte';
  import UploadPlaceholder from './UploadPlaceholder.svelte';
  import { onMount } from 'svelte';

  // New props for category support
  export let images: Image[] = [];
  export let isCategory: boolean = false;
  export let categoryId: string = '';

  // Local copy of images for editing in admin mode
  let localImages: Image[] = [];
  let isModified = false;

  // Subscribe to the image store and get updates if not in category mode
  onMount(() => {
    if (!isCategory) {
      const unsubscribe = imageStore.subscribe(value => {
        localImages = value;
      });
      return unsubscribe;
    } else {
      // If in category mode, use the provided images
      localImages = images;
    }
  });

  $: {
    // Update local images when category images change
    if (isCategory) {
      localImages = images;
    }
  }

  // Function to handle saving changes
  function saveChanges() {
    imageStore.set(localImages);
    isModified = false;
    // In a real application, this would send data to a server
    alert('Changes saved successfully (mock)');
  }

  // Function to discard changes
  function discardChanges() {
    imageStore.reset();
    isModified = false;
    alert('Changes discarded');
  }

  // Function to handle image removal
  function handleRemoveImage(id: string) {
    localImages = localImages.filter(img => img.id !== id);
    isModified = true;
  }

  // Function to handle new image addition
  function handleAddImages(newImages: Image[]) {
    // If in category mode, set the category ID for new images
    if (isCategory && categoryId) {
      newImages = newImages.map(img => ({
        ...img,
        categoryId
      }));
    }
    localImages = [...localImages, ...newImages];
    isModified = true;
  }
</script>

<div class="gallery-container py-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {#each localImages as image (image.id)}
      <ImageCard 
        {image} 
        {isCategory}
        isAdmin={$adminMode} 
        on:remove={() => handleRemoveImage(image.id)} 
      />
    {/each}
    
    {#if $adminMode}
      <UploadPlaceholder on:addImages={e => handleAddImages(e.detail)} />
    {/if}
  </div>

  {#if $adminMode && isModified}
    <div class="admin-actions mt-6 flex space-x-4">
      <button 
        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        on:click={saveChanges}
      >
        Save Changes
      </button>
      <button 
        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        on:click={discardChanges}
      >
        Discard Changes
      </button>
    </div>
  {/if}
</div>