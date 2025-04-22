<script>
    import { page } from '$app/state';
</script>

<svelte:head>
    <title>Error {page.status} | Photography Portfolio</title>
</svelte:head>

<div class="error-page flex min-h-[70vh] flex-col items-center justify-center p-6">
    <div class="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-md">
        <h1 class="mb-4 text-3xl font-bold text-red-600">
            {page.status}: {page.error?.message || 'Something went wrong'}
        </h1>

        <div class="my-6 text-gray-700">
            {#if page.status === 404}
                <p>The category you're looking for doesn't exist.</p>
                <p class="mt-2">It may have been removed or you might have mistyped the URL.</p>
            {:else if page.status === 503}
                <p>Cannot connect to the content management system.</p>
                <p class="mt-2">Please try again later or contact the site administrator.</p>
            {:else}
                <p>We encountered an error while trying to load this category.</p>
                <p class="mt-2">Please try again or return to the home page.</p>
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
