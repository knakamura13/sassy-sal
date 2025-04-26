<script lang="ts">
    import { onMount } from 'svelte';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { adminMode } from '$lib/stores/adminStore';
    import type { ActionResult } from '@sveltejs/kit';

    const secret = 'admin';
    let sequence = '';
    let showModal = false;
    let password = '';
    let loading = false;
    let errorMessage = '';

    function handleKeydown(e: KeyboardEvent) {
        if (document.activeElement instanceof HTMLInputElement) {
            return;
        }
        const key = e.key.toLowerCase();
        if (key.length === 1) {
            sequence += key;
            if (!secret.startsWith(sequence)) {
                sequence = key;
                if (!secret.startsWith(sequence)) {
                    sequence = '';
                }
            }
            if (sequence === secret) {
                sequence = '';
                showModal = true;
            }
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    });

    function handleFormSubmit() {
        loading = true;
        errorMessage = '';

        return async ({ result, update }: { result: ActionResult; update: () => Promise<void> }) => {
            loading = false;
            if (result.type === 'failure') {
                errorMessage = result.data?.message || 'Invalid password';
                await update();
            } else if (result.type === 'redirect') {
                adminMode.login();
                showModal = false;
                await goto('/');
            }
        };
    }

    function closeModal() {
        showModal = false;
        password = '';
        errorMessage = '';
    }
</script>

{#if showModal}
    <div class="admin-easter-egg-overlay">
        <div class="admin-easter-egg-modal">
            <h2 class="mb-4 text-xl font-bold">Admin Login</h2>
            <form method="POST" action="/admin?/login" use:enhance={handleFormSubmit}>
                <input
                    type="password"
                    name="password"
                    bind:value={password}
                    placeholder="Enter password"
                    required
                    class="mb-2 w-full rounded-md border bg-transparent p-2 focus:outline-none"
                    disabled={loading}
                />
                {#if errorMessage}
                    <p class="mb-2 text-sm text-red-500">{errorMessage}</p>
                {/if}
                <div class="flex justify-end space-x-2">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="rounded-md bg-gray-300 px-4 py-2 hover:bg-gray-400"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .admin-easter-egg-overlay {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .admin-easter-egg-modal {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
</style>
