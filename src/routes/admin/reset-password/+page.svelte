<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ActionResult } from '@sveltejs/kit';

    let password = '';
    let confirmPassword = '';
    let loading = false;
    let errorMessage = '';
    let success = false;

    // Get token and email from URL
    $: token = $page.url.searchParams.get('token') || '';
    $: email = $page.url.searchParams.get('email') || '';
    $: invalidRequest = !token || !email;

    // Handle form submission
    function handleSubmit() {
        loading = true;
        errorMessage = '';

        // Client-side validation
        if (password !== confirmPassword) {
            loading = false;
            errorMessage = 'Passwords do not match';
            return () => {};
        }

        return async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
            loading = false;

            if (result.type === 'success') {
                success = true;
                update();

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    goto('/admin');
                }, 3000);
            } else if (result.type === 'failure') {
                errorMessage = result.data?.message || 'Failed to reset password';
                update();
            }
        };
    }
</script>

<svelte:head>
    <title>Reset Password | Photography Portfolio</title>
</svelte:head>

<div class="admin-reset h-full min-h-[80vh] flex items-center justify-center">
    <div class="max-w-md w-full p-6 bg-white shadow-md">
        <h1 class="text-2xl font-bold mb-6 text-center">Reset Password</h1>

        {#if invalidRequest}
            <div class="text-center p-4">
                <p class="text-red-600 mb-4">Invalid or expired reset link.</p>
                <a href="/admin" class="text-blue-600 underline">Back to login</a>
            </div>
        {:else if success}
            <div class="text-center p-4">
                <p class="text-green-600 mb-4">Password reset successful!</p>
                <p>Redirecting to login page...</p>
            </div>
        {:else}
            <form method="POST" use:enhance={handleSubmit}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="email" value={email} />

                <div class="mb-4">
                    <label class="block text-gray-700 mb-2" for="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        bind:value={password}
                        class="w-full p-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                        required
                        minlength="8"
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 mb-2" for="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        bind:value={confirmPassword}
                        class="w-full p-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                        required
                        minlength="8"
                    />

                    {#if errorMessage}
                        <p class="text-red-500 text-sm mt-1">{errorMessage}</p>
                    {/if}
                </div>

                <button
                    type="submit"
                    class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <p class="mt-4 text-center">
                    <a href="/admin" class="text-blue-600 text-sm underline">Back to login</a>
                </p>
            </form>
        {/if}
    </div>
</div>
