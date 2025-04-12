<script lang="ts">
    import { goto } from '$app/navigation';
    import { adminMode } from '$lib/stores/adminStore';
    import { enhance } from '$app/forms';
    import type { ActionResult } from '@sveltejs/kit';

    let password = '';
    let loading = false;
    let errorMessage = '';
    let showPasswordReset = false;
    let email = '';
    let resetSent = false;

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

    // Toggle password reset form
    function togglePasswordReset() {
        showPasswordReset = !showPasswordReset;
        resetSent = false;
    }

    // Handle password reset form
    function handleResetSubmit() {
        loading = true;
        errorMessage = '';

        return async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
            loading = false;

            if (result.type === 'success') {
                resetSent = true;
                update();
            } else if (result.type === 'failure') {
                errorMessage = result.data?.message || 'Failed to send reset link';
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

        {#if !showPasswordReset}
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

                <p class="mt-4 text-center">
                    <button type="button" class="text-sm text-blue-600 underline" on:click={togglePasswordReset}>
                        Forgot password?
                    </button>
                </p>
            </form>
        {:else if resetSent}
            <div class="p-4 text-center">
                <p class="mb-4 text-green-600">Password reset link sent to your email.</p>
                <button class="text-blue-600 underline" on:click={togglePasswordReset}> Back to login </button>
            </div>
        {:else}
            <form method="POST" action="?/resetPassword" use:enhance={handleResetSubmit}>
                <div class="mb-4">
                    <label class="mb-2 block text-gray-700" for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        bind:value={email}
                        class="w-full rounded-md border border-gray-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
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
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <p class="mt-4 text-center">
                    <button type="button" class="text-sm text-blue-600 underline" on:click={togglePasswordReset}>
                        Back to login
                    </button>
                </p>
            </form>
        {/if}
    </div>
</div>
