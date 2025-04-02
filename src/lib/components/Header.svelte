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
  let scrollY: number = 0;
  let compact = false;
  
  // Only change state when we cross thresholds with some buffer
  $: {
    if (!compact && scrollY > 20) {
      compact = true;
    } else if (compact && scrollY <= 20) {
      compact = false;
    }
  }
  
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

<svelte:window bind:scrollY />

<div class="header-container fixed top-0 left-0 right-0 z-50">
  <header class="flex items-center justify-between px-4 md:px-6 bg-gray-800 text-white transition-all duration-300 {compact ? 'h-12 bg-opacity-90 backdrop-blur-sm' : 'h-16'} w-full">
      <div class="flex gap-4 items-center">
          <a href={$adminMode ? '/?admin=true' : '/'} class="flex gap-4 items-center cursor-pointer">
              <!-- Fixed width container prevents layout shift -->
              <div class="h-6 w-6 flex items-center justify-center transition-transform duration-300 {compact ? 'scale-75' : 'scale-100'}">
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
              <h1 class="font-bold transition-all duration-300 {compact ? 'text-lg' : 'text-xl'}">Photography Portfolio</h1>
          </a>
      </div>
      
      <div class="flex items-center gap-4">
          {#if $adminMode}
              <span class="text-sm text-green-400 mr-2 transition-opacity duration-300 {compact ? 'opacity-75' : 'opacity-100'}">Admin Mode</span>
              <button 
                  class="transition-all duration-300 {compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'} bg-red-600 hover:bg-red-700 text-white rounded-md"
                  on:click={handleLogout}
              >
                  Logout
              </button>
          {:else}
              <a 
                  href="/admin" 
                  class="transition-all duration-300 {compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'} bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                  Admin
              </a>
          {/if}
      </div>
  </header>
</div>

<!-- Spacer div to prevent content from being hidden under the fixed header -->
<div class="{compact ? 'h-12' : 'h-16'} transition-all duration-300"></div>

<style>
  .header-container {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
