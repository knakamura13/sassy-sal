<script lang="ts">
  import { adminMode } from '$lib/stores/adminStore';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  // Simple function to check if a file exists (runs once at component mount)
  function getLogoPath() {
    // We prefer SVG as our primary logo format
    return '/icons/logo.svg';
  }
  
  const logoPath = getLogoPath();
  let showLogo = true;
  let logoLoaded = false;
  
  function handleError() {
    showLogo = false;
  }
  
  function handleLoad() {
    logoLoaded = true;
  }
  
  // Preload the logo image
  onMount(() => {
    if (browser) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = logoPath;
      link.as = 'image';
      document.head.appendChild(link);
    }
  });
</script>

<svelte:head>
  <!-- Preload the logo in the document head -->
  <link rel="preload" href={logoPath} as="image">
</svelte:head>

<header class="flex items-center justify-between h-16 px-4 md:px-6 bg-gray-800 text-white">
    <div class="flex gap-4 items-center">
        <!-- Fixed width container prevents layout shift -->
        <div class="h-6 w-6 flex items-center justify-center">
          {#if showLogo}
            <img 
                alt="Site logo" 
                class="h-6 w-6 filter invert transition-opacity duration-100 {logoLoaded ? 'opacity-100' : 'opacity-0'}" 
                src={logoPath} 
                title="Site logo" 
                on:error={handleError}
                on:load={handleLoad}
            />
          {/if}
        </div>
        <h1 class="font-bold text-xl">Photography Portfolio</h1>
    </div>
    
    <div class="flex items-center gap-4">
        {#if $adminMode}
            <a 
                href="/" 
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                on:click|preventDefault={() => adminMode.logout()}
            >
                Logout
            </a>
        {:else}
            <a 
                href="/admin" 
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
                Admin
            </a>
        {/if}
    </div>
</header>
