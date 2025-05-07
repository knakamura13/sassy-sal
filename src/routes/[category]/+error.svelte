<script>
    import { page } from '$app/state';
</script>

<svelte:head>
    <title>Error {page.status} | Photography Portfolio</title>
</svelte:head>

<div class="error-page flex min-h-[70vh] flex-col items-center justify-center p-6">
    <div class="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-md">
        <h1 class="mb-4 text-3xl font-bold text-red-600">
            {page.error?.message || 'Oops! Something went wrong'}
        </h1>

        <div class="my-6 text-gray-700">
            {#if page.status === 404}
                <p>I'm sorry, but this photography collection isn't available.</p>
                <p class="mt-2">The page may have been moved or the URL might have been mistyped.</p>
            {:else if page.status === 503}
                <p>The image gallery is currently unavailable.</p>
                <p class="mt-2">
                    Please try again in a few moments or feel free to
                    <a href="/about-me" class="link link--zoomies">contact me</a>
                    directly.
                </p>
            {:else}
                <p>I'm having trouble displaying this photography collection right now.</p>
                <p class="mt-2">Please try again or explore other collections from the home page.</p>
            {/if}
        </div>

        <a
            href="/"
            class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
            Return to Home
        </a>
    </div>
</div>

<style>
    .error-page {
        background-color: #f9fafb;
    }
</style>
