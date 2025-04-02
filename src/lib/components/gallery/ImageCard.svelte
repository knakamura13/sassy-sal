<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Image } from '$lib/stores/imageStore';
  
  export let image: Image;
  export let isAdmin: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  function handleRemove() {
    dispatch('remove', image.id);
  }
</script>

<div class="image-card-wrapper !m-auto">
  <div class="image-card relative overflow-hidden rounded-lg shadow-md w-full h-full">
    <img 
      src={image.url} 
      alt={image.alt} 
      class="w-full h-full object-cover" 
    />
    
    {#if image.title}
      <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
        <h3 class="text-sm md:text-base font-medium">{image.title}</h3>
      </div>
    {/if}
    
    {#if isAdmin}
      <button 
        class="absolute !m-0 top-2 right-2 bg-gray-600 bg-opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none"
        on:click={handleRemove}
        aria-label="Remove image"
      >
        ×
      </button>
    {/if}
  </div> 
</div>

<style lang="scss">
  .image-card-wrapper {
    @apply aspect-square w-full relative;
  }

  .image-card {
    @apply transition-all duration-200 absolute inset-0;
    
    &:hover {
      @apply transform scale-[1.01];
    }
  }
</style> 