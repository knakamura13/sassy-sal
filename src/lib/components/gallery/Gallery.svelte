<script lang="ts">
  import { imageStore, type Image } from '$lib/stores/imageStore';
  import { adminMode } from '$lib/stores/adminStore';
  import ImageCard from './ImageCard.svelte';
  import UploadPlaceholder from './UploadPlaceholder.svelte';
  import { onMount } from 'svelte';

  // Local copy of images for editing in admin mode
  let images: Image[] = [];
  let isModified = false;

  // Subscribe to the image store and get updates
  onMount(() => {
    const unsubscribe = imageStore.subscribe(value => {
      images = value;
    });

    return unsubscribe;
  });

  // Function to handle saving changes
  function saveChanges() {
    imageStore.set(images);
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
    images = images.filter(img => img.id !== id);
    isModified = true;
  }

  // Function to handle new image addition
  function handleAddImages(newImages: Image[]) {
    images = [...images, ...newImages];
    isModified = true;
  }
</script>

<div class="gallery-container py-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {#each images as image (image.id)}
      <ImageCard 
        {image} 
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