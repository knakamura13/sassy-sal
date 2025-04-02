<script lang="ts">
  import { goto } from '$app/navigation';
  import { adminMode } from '$lib/stores/adminStore';
  
  let password = '';
  let errorMessage = '';
  
  // Dummy password - in a real app, this would be a proper authentication system
  const correctPassword = 'admin123';
  
  function handleLogin() {
    if (password === correctPassword) {
      adminMode.login();
      goto('/');
    } else {
      errorMessage = 'Incorrect password';
    }
  }
</script>

<svelte:head>
    <title>Admin Login</title>
</svelte:head>

<div class="min-h-[80vh] flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
    <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
    
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter admin password"
          required
        />
      </div>
      
      {#if errorMessage}
        <div class="text-red-600 text-sm">{errorMessage}</div>
      {/if}
      
      <button 
        type="submit" 
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Log In
      </button>
    </form>
    
    <div class="mt-4 text-center">
      <a href="/" class="text-sm text-blue-600 hover:underline">Return to homepage</a>
    </div>
  </div>
</div> 