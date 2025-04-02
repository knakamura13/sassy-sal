<script lang="ts">
  import { adminMode } from '$lib/stores/adminStore';
</script>

<header class="flex items-center justify-between h-16 px-4 md:px-6 bg-gray-800 text-white">
    <div class="flex gap-4 items-center">
        <img alt="Site logo" class="h-6" src="/icons/logo.svg" title="Site logo" />
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
