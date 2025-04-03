<script>
    export let data;

    // Prettify JSON for display
    function prettyJson(obj) {
        return JSON.stringify(obj, null, 2);
    }
</script>

<svelte:head>
    <title>API Diagnostics</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
    <h1 class="text-3xl font-bold mb-8">Strapi API Diagnostics</h1>

    <div class="bg-blue-50 p-4 rounded-lg mb-8">
        <h2 class="text-xl font-medium mb-2">API Configuration</h2>
        <p>Strapi API URL: <code class="bg-blue-100 px-2 py-1 rounded">{data.apiUrl}</code></p>
    </div>

    {#if data.error}
        <div class="bg-red-50 p-4 rounded-lg mb-8">
            <h2 class="text-xl font-medium text-red-800 mb-2">API Connection Error</h2>
            <p class="text-red-700">{data.error.message}</p>
            <pre class="bg-red-100 p-4 rounded-lg mt-4 overflow-auto text-sm">{data.error.stack}</pre>
        </div>
    {:else}
        <div class="mb-8">
            <h2 class="text-xl font-medium mb-4">Categories API Response</h2>
            <div class="p-2 bg-gray-100 rounded-lg">
                <p class="mb-2">
                    Status: <span class={data.categoriesResponse.status === 200 ? 'text-green-600' : 'text-red-600'}>
                        {data.categoriesResponse.status}
                        {data.categoriesResponse.statusText}
                    </span>
                </p>

                {#if data.categoriesResponse.data.data?.length > 0}
                    <p class="mb-2">Found {data.categoriesResponse.data.data.length} categories:</p>
                    <ul class="list-disc pl-5 mb-4">
                        {#each data.categoriesResponse.data.data as category}
                            <li>
                                <strong>{category.attributes?.name || 'Unnamed'}</strong>
                                (slug: {category.attributes?.slug || 'none'}, id: {category.id})
                            </li>
                        {/each}
                    </ul>
                {/if}

                <details class="mt-4">
                    <summary class="cursor-pointer font-medium">View Raw Response</summary>
                    <pre class="bg-gray-50 p-4 rounded-lg mt-2 overflow-auto text-xs">{prettyJson(
                            data.categoriesResponse.data
                        )}</pre>
                </details>
            </div>
        </div>

        {#if data.categoryResponse}
            <div class="mb-8">
                <h2 class="text-xl font-medium mb-4">
                    Category Detail API Response (slug: {data.categoryResponse.slug})
                </h2>
                <div class="p-2 bg-gray-100 rounded-lg">
                    <p class="mb-2">
                        Status: <span class={data.categoryResponse.status === 200 ? 'text-green-600' : 'text-red-600'}>
                            {data.categoryResponse.status}
                        </span>
                    </p>

                    {#if data.categoryResponse.data.data?.length > 0}
                        <div class="mb-4">
                            <h3 class="font-medium">Category Structure:</h3>
                            <ul class="list-disc pl-5">
                                {#each Object.keys(data.categoryResponse.data.data[0].attributes || {}) as key}
                                    <li>
                                        {key}:
                                        {#if key === 'images'}
                                            {data.categoryResponse.data.data[0].attributes[key]?.data?.length || 0} images
                                        {:else if typeof data.categoryResponse.data.data[0].attributes[key] === 'object'}
                                            [Object]
                                        {:else}
                                            {data.categoryResponse.data.data[0].attributes[key]}
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}

                    <details class="mt-4">
                        <summary class="cursor-pointer font-medium">View Raw Response</summary>
                        <pre class="bg-gray-50 p-4 rounded-lg mt-2 overflow-auto text-xs">{prettyJson(
                                data.categoryResponse.data
                            )}</pre>
                    </details>
                </div>
            </div>
        {/if}
    {/if}

    <div class="mt-8">
        <h2 class="text-xl font-medium mb-4">Debugging Actions</h2>
        <div class="flex flex-wrap gap-4">
            <a href="/" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Return to Home</a>
            <button
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                on:click={() => window.location.reload()}
            >
                Refresh Data
            </button>
            {#if data.categoryResponse?.slug}
                <a
                    href="/{data.categoryResponse.slug}"
                    class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                    View Category Page
                </a>
                <a
                    href="/{data.categoryResponse.slug}?admin=true"
                    class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                    View in Admin Mode
                </a>
            {/if}
        </div>
    </div>
</div>
