<script>
    import { goto } from '$app/navigation';
</script>

<svelte:head>
    <title>Debug Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">Debug Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/debug/strapi" class="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 class="text-xl font-semibold mb-2">Strapi Integration</h2>
            <p class="text-gray-600">Test and debug the Strapi CMS connection, API endpoints, and CRUD operations.</p>
            <div class="mt-4">
                <button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                    Open Strapi Debug
                </button>
            </div>
        </a>
    </div>
</div>
