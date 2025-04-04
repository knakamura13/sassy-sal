<script lang="ts">
    import { goto } from '$app/navigation';
    import { adminMode } from '$lib/stores/adminStore';

    let password = '';
    let error = '';

    // Handle admin login
    function login() {
        // Simple mock authentication for demo purposes
        // In a real app, this would be server-side validated
        if (password === 'password') {
            adminMode.login();
            goto('/?admin=true');
        } else {
            error = 'Invalid password';
        }
    }

    // Handle Enter key press
    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            login();
        }
    }
</script>

<svelte:head>
    <title>Admin Login | Photography Portfolio</title>
</svelte:head>

<div class="admin-login min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        <div class="mb-4">
            <label class="block text-gray-700 mb-2" for="password">Password</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                on:keypress={handleKeyPress}
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
            />
            {#if error}
                <p class="text-red-500 text-sm mt-1">{error}</p>
            {/if}
        </div>

        <button
            on:click={login}
            class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
            Login
        </button>

        <p class="mt-4 text-gray-600 text-sm text-center">Note: For demo purposes, the password is "password"</p>
    </div>
</div>
