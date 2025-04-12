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

<div class="admin-reset flex h-full min-h-[80vh] items-center justify-center">
    <div class="w-full max-w-md bg-white p-6 shadow-md">
        <h1 class="mb-6 text-center text-2xl font-bold">Reset Password</h1>

        {#if invalidRequest}
            <div class="p-4 text-center">
                <p class="mb-4 text-red-600">Invalid or expired reset link.</p>
                <a href="/admin" class="text-blue-600 underline">Back to login</a>
            </div>
        {:else if success}
            <div class="p-4 text-center">
                <p class="mb-4 text-green-600">Password reset successful!</p>
                <p>Redirecting to login page...</p>
            </div>
        {:else}
            <form method="POST" use:enhance={handleSubmit}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="email" value={email} />

                <div class="mb-4">
                    <label class="mb-2 block text-gray-700" for="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        bind:value={password}
                        class="w-full rounded-md border border-gray-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                        required
                        minlength="8"
                    />
                </div>

                <div class="mb-4">
                    <label class="mb-2 block text-gray-700" for="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        bind:value={confirmPassword}
                        class="w-full rounded-md border border-gray-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                        required
                        minlength="8"
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
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <p class="mt-4 text-center">
                    <a href="/admin" class="text-sm text-blue-600 underline">Back to login</a>
                </p>
            </form>
        {/if}
    </div>
</div>
