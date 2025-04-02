<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import type { Image } from '$lib/stores/imageStore';
  
  // Add categoryId as a prop to support category galleries
  export let categoryId: string = '';
  
  const dispatch = createEventDispatcher<{addImages: Image[]}>();
  
  let showForm = false;
  let imageTitle = '';
  let imageAlt = '';
  let imageUrl = '';
  
  function resetForm() {
    showForm = false;
    imageTitle = '';
    imageAlt = '';
    imageUrl = '';
  }
  
  function handleSubmit() {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }
    
    // Create a new image object
    const newImage: Image = {
      id: uuidv4(),
      url: imageUrl.trim(),
      alt: imageAlt.trim() || 'Image description',
      title: imageTitle.trim() || undefined,
      categoryId: categoryId || '1' // Default to first category if not specified
    };
    
    dispatch('addImages', [newImage]);
    resetForm();
  }
</script>

<div class="upload-placeholder aspect-square w-full">
  {#if showForm}
    <div class="h-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col">
      <h3 class="text-lg font-medium mb-4">Add New Image</h3>
      
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1" for="imageUrl">Image URL*</label>
        <input 
          type="text" 
          id="imageUrl" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md" 
          bind:value={imageUrl}
          placeholder="https://example.com/image.jpg"
          required
        />
      </div>
      
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1" for="imageTitle">Title</label>
        <input 
          type="text" 
          id="imageTitle" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md" 
          bind:value={imageTitle}
          placeholder="Image title (optional)"
        />
      </div>
      
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1" for="imageAlt">Alt Text</label>
        <input 
          type="text" 
          id="imageAlt" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md" 
          bind:value={imageAlt}
          placeholder="Image description for accessibility"
        />
      </div>
      
      <div class="mt-auto flex space-x-2">
        <button 
          class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          on:click={handleSubmit}
        >
          Add Image
        </button>
        <button 
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
          on:click={resetForm}
        >
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <button 
      class="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-colors"
      on:click={() => showForm = true}
    >
      <div class="text-5xl text-gray-400 mb-2">+</div>
      <div class="text-gray-500 font-medium">Add Image</div>
    </button>
  {/if}
</div>
