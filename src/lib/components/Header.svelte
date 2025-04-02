<script lang="ts">
  import { adminMode } from '$lib/stores/adminStore';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let logoPath = '/icons/logo.svg'; // Start with SVG as default
  let fallbackPath = '/icons/logo.png'; // Fallback to PNG
  let showLogo = true;
  let logoLoaded = false;
  let usingSvg = true;
  
  function handleSvgError() {
    // If SVG fails, try PNG
    if (usingSvg) {
      usingSvg = false;
      logoPath = fallbackPath;
    } else {
      // If PNG also fails, hide the logo
      showLogo = false;
    }
  }
  
  function handleLoad() {
    logoLoaded = true;
  }
  
  function handleLogout() {
    adminMode.logout();
    goto('/');
  }
  
  // Preload both possible logo formats
  onMount(() => {
    if (browser) {
      // Preload SVG
      const linkSvg = document.createElement('link');
      linkSvg.rel = 'preload';
      linkSvg.href = '/icons/logo.svg';
      linkSvg.as = 'image';
      document.head.appendChild(linkSvg);
      
      // Also preload PNG as fallback
      const linkPng = document.createElement('link');
      linkPng.rel = 'preload';
      linkPng.href = '/icons/logo.png';
      linkPng.as = 'image';
      document.head.appendChild(linkPng);
    }
  });
</script>

<svelte:head>
  <!-- Preload both possible logo formats -->
  <link rel="preload" href="/icons/logo.svg" as="image">
  <link rel="preload" href="/icons/logo.png" as="image">
</svelte:head>

<header class="flex items-center justify-between h-16 px-4 md:px-6 bg-gray-800 text-white">
    <div class="flex gap-4 items-center">
        <a href={$adminMode ? '/?admin=true' : '/'} class="flex gap-4 items-center cursor-pointer">
            <!-- Fixed width container prevents layout shift -->
            <div class="h-6 w-6 flex items-center justify-center">
              {#if showLogo}
                <img 
                    alt="Site logo" 
                    class="h-6 w-6 filter invert transition-opacity duration-100 {logoLoaded ? 'opacity-100' : 'opacity-0'}" 
                    src={logoPath} 
                    title="Site logo" 
                    on:error={handleSvgError}
                    on:load={handleLoad}
                />
              {/if}
            </div>
            <h1 class="font-bold text-xl">Photography Portfolio</h1>
        </a>
    </div>
    
    <div class="flex items-center gap-4">
        {#if $adminMode}
            <span class="text-sm text-green-400 mr-2">Admin Mode</span>
            <button 
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                on:click={handleLogout}
            >
                Logout
            </button>
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
