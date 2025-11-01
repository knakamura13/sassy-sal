<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    $: status = $page.error?.status || 500;
    $: message = $page.error?.message || 'An unexpected error occurred';

    function handleRetry() {
        // Reload the current page
        window.location.reload();
    }

    function goHome() {
        goto('/');
    }
</script>

<svelte:head>
    <title>Error {status} | Photography Portfolio</title>
</svelte:head>

<div class="container mx-auto flex min-h-[60vh] max-w-screen-lg flex-col items-center justify-center px-4 py-16">
    <div class="text-center">
        <h1 class="font-didot mb-4 text-6xl text-gray-400">{status}</h1>

        {#if status === 503}
            <h2 class="mb-4 text-2xl font-light">Service Temporarily Unavailable</h2>
            <p class="mb-8 text-gray-600">We're experiencing some connectivity issues. This is usually temporary.</p>
            <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <button on:click={handleRetry} class="btn btn-primary"> Try Again </button>
                <button on:click={goHome} class="btn btn-secondary"> Go Home </button>
            </div>
        {:else if status === 404}
            <h2 class="mb-4 text-2xl font-light">Page Not Found</h2>
            <p class="mb-8 text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
            <button on:click={goHome} class="btn btn-primary"> Go Home </button>
        {:else}
            <h2 class="mb-4 text-2xl font-light">Something went wrong</h2>
            <p class="mb-2 text-gray-600">{message}</p>
            {#if status >= 500}
                <p class="mb-8 text-sm text-gray-500">If this problem persists, please try refreshing the page.</p>
                <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <button on:click={handleRetry} class="btn btn-primary"> Refresh Page </button>
                    <button on:click={goHome} class="btn btn-secondary"> Go Home </button>
                </div>
            {:else}
                <button on:click={goHome} class="btn btn-primary"> Go Home </button>
            {/if}
        {/if}
    </div>
</div>

<style lang="scss">
    @use '../lib/styles/variables' as vars;
    @use 'sass:color';

    .btn {
        display: inline-block;
        padding: 0.75rem 2rem;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        border-radius: 4px;

        &.btn-primary {
            background-color: vars.$primary-color;
            color: white;

            &:hover {
                background-color: color.adjust(vars.$primary-color, $lightness: -10%);
            }
        }

        &.btn-secondary {
            background-color: transparent;
            color: vars.$primary-color;
            border: 2px solid vars.$primary-color;

            &:hover {
                background-color: vars.$primary-color;
                color: white;
            }
        }
    }
</style>
