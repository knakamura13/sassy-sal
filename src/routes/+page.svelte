<script lang="ts">
  import { onMount } from 'svelte';
  import { categoryStore, type Category } from '$lib/stores/categoryStore';
  import { adminMode } from '$lib/stores/adminStore';
  import CategoryCard from '$lib/components/category/CategoryCard.svelte';
  import CategoryUploadPlaceholder from '$lib/components/category/CategoryUploadPlaceholder.svelte';

  // Get data from loader
  export let data;
  
  // Local copy of categories for editing in admin mode
  let categories: Category[] = [];
  let isModified = false;

  // Set admin mode from URL parameter
  $: if (data.admin) {
    adminMode.set(true);
  }

  // Subscribe to the category store and get updates
  onMount(() => {
    const unsubscribe = categoryStore.subscribe(value => {
      categories = value;
    });

    return unsubscribe;
  });

  // Function to handle saving changes
  function saveChanges() {
    categoryStore.set(categories);
    isModified = false;
    // In a real application, this would send data to a server
    alert('Changes saved successfully (mock)');
  }

  // Function to discard changes
  function discardChanges() {
    categoryStore.reset();
    isModified = false;
    alert('Changes discarded');
  }

  // Function to handle category removal
  function handleRemoveCategory(id: string) {
    categories = categories.filter(cat => cat.id !== id);
    isModified = true;
  }

  // Function to handle new category addition
  function handleAddCategory(event: CustomEvent<Category>) {
    categories = [...categories, event.detail];
    isModified = true;
  }
</script>

<svelte:head>
    <title>Photography Portfolio</title>
</svelte:head>

<div class="page relative min-h-[100vh]" id="home">
    <section class="intro text-center my-8">
        <h1 class="text-3xl font-medium">Photography Portfolio</h1>
        <p class="text-lg text-gray-600 mt-2">Explore my photography collections</p>
    </section>

    <div class="container mx-auto px-4">
        <div class="category-container py-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each categories as category (category.id)}
                    <CategoryCard 
                        {category} 
                        isAdmin={$adminMode} 
                        on:remove={() => handleRemoveCategory(category.id)}
                    />
                {/each}
                
                {#if $adminMode}
                    <CategoryUploadPlaceholder on:addCategory={handleAddCategory} />
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
    </div>
</div>

<style lang="scss">
  /* Global styles - these will affect the app layout */
  :global(html, body) {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }
</style>
