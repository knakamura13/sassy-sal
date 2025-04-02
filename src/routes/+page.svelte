<script lang="ts">
  import Gallery from '$lib/components/gallery/Gallery.svelte';
  import { adminMode } from '$lib/stores/adminStore';
</script>

<svelte:head>
    <title>Photography Portfolio</title>
</svelte:head>

<div class="page" id="home">
    <section class="intro text-center my-8">
        <h1 class="text-3xl font-medium">Photography Portfolio</h1>
        <p class="text-lg text-gray-600 mt-2">A collection of beautiful photographs</p>
    </section>

    <div class="container mx-auto px-4">
        <Gallery />
    </div>

    {#if $adminMode}
        <div class="fixed bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded-full font-medium shadow-lg">
            Admin Mode Active
        </div>
    {/if}
</div>

<style lang="scss">
  .page {
    min-height: 100vh;
    position: relative;
  }

  /* Global styles - these will affect the app layout */
  :global(html, body) {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }
</style>
