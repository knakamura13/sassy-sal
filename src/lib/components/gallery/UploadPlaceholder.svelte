<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { generateId } from '$lib/utils/id';
  import type { Image } from '$lib/stores/imageStore';
  
  const dispatch = createEventDispatcher();
  let dragActive = false;
  let fileInput: HTMLInputElement;
  
  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      processFiles(target.files);
    }
  }
  
  // Handle drag events
  function handleDragEnter() {
    dragActive = true;
  }
  
  function handleDragLeave() {
    dragActive = false;
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
    
    if (event.dataTransfer?.files) {
      processFiles(event.dataTransfer.files);
    }
  }
  
  // Process the selected files
  function processFiles(files: FileList) {
    const newImages: Image[] = [];
    
    // For each file, create a URL and add to images
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newImages.push({
          id: generateId(),
          url,
          alt: file.name,
          title: file.name.split('.')[0]
        });
      }
    });
    
    if (newImages.length > 0) {
      dispatch('addImages', newImages);
    }
    
    // Reset the file input
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  function openFileDialog() {
    if (fileInput) {
      fileInput.click();
    }
  }
</script>

<div 
  class="upload-placeholder aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center"
  class:border-blue-400={!dragActive}
  class:border-blue-600={dragActive}
  class:bg-blue-50={dragActive}
  on:click={openFileDialog}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
  <p class="text-gray-700 font-medium">Add Image</p>
  <p class="text-gray-500 text-sm mt-1">Click or drag images here</p>
  
  <input 
    type="file" 
    bind:this={fileInput}
    on:change={handleFileSelect}
    accept="image/*" 
    multiple 
    class="hidden"
  />
</div>

<style lang="scss">
  .upload-placeholder {
    @apply bg-gray-50 hover:bg-gray-100;
  }
</style> 