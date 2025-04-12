<script lang="ts">
    import { goto } from '$app/navigation';
    import { adminMode } from '$lib/stores/adminStore';
    import { enhance } from '$app/forms';
    import type { ActionResult } from '@sveltejs/kit';

    let password = '';
    let loading = false;
    let errorMessage = '';

    // Handle form enhancements
    function handleFormSubmit() {
        loading = true;
        errorMessage = '';

        return async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
            loading = false;

            if (result.type === 'success') {
                adminMode.login();
                goto('/?admin=true');
            } else if (result.type === 'failure') {
                errorMessage = result.data?.message || 'Invalid password';
                update();
            }
        };
    }
</script>

<svelte:head>
    <title>Admin Login | Photography Portfolio</title>
</svelte:head>

<div class="admin-login flex h-full min-h-[80vh] items-center justify-center">
    <div class="w-full max-w-md bg-white p-6 shadow-md">
        <h1 class="mb-6 text-center text-2xl font-bold">Admin Login</h1>

        <form method="POST" action="?/login" use:enhance={handleFormSubmit}>
            <div class="mb-4">
                <label class="mb-2 block text-gray-700" for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    bind:value={password}
                    class="w-full rounded-md border border-gray-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                />
                {#if errorMessage}
                    <p class="mt-1 text-sm text-red-500">{errorMessage}</p>
                {/if}
            </div>

            <button
                type="submit"
                class="w-full rounded-md bg-blue-600 py-2 text-white transition-colors hover:bg-blue-700"
                disabled={loading}
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    </div>
</div>
