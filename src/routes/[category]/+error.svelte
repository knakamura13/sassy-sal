<script>
    import { page } from '$app/stores';
</script>

<div class="error-page flex flex-col items-center justify-center min-h-[70vh] p-6">
    <div class="max-w-lg w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 class="text-3xl font-bold text-red-600 mb-4">
            {$page.status}: {$page.error?.message || 'Something went wrong'}
        </h1>

        <div class="my-6 text-gray-700">
            {#if $page.status === 404}
                <p>The category you're looking for doesn't exist.</p>
                <p class="mt-2">It may have been removed or you might have mistyped the URL.</p>
            {:else if $page.status === 503}
                <p>Cannot connect to the content management system.</p>
                <p class="mt-2">Please try again later or contact the site administrator.</p>
            {:else}
                <p>We encountered an error while trying to load this category.</p>
                <p class="mt-2">Please try again or return to the home page.</p>
            {/if}
        </div>

        <a
            href="/"
            class="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
