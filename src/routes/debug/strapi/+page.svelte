<script>
    // Import the data from the server-side load function
    export let data;

    // For testing write operations
    let testCategoryName = 'Test Category';
    let writeStatus = null;
    let deleteStatus = null;
    let uploadStatus = null;
    let isLoading = false;
    let isDeleting = false;
    let isUploading = false;
    let categoryToDelete = '';
    let selectedFile = null;

    // Function to test writing to Strapi
    async function testWriteOperation() {
        isLoading = true;
        writeStatus = null;

        try {
            const testData = {
                data: {
                    name: testCategoryName,
                    slug: testCategoryName.toLowerCase().replace(/\s+/g, '-')
                }
            };

            const response = await fetch(`${data.strapiUrl}/api/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            const status = response.status;
            let responseData = null;

            try {
                responseData = await response.json();
            } catch (e) {
                // Handle non-JSON responses
            }

            writeStatus = {
                success: response.ok,
                status,
                data: responseData,
                error: !response.ok ? 'Failed to create test category' : null
            };
        } catch (error) {
            writeStatus = {
                success: false,
                error: error.message
            };
        }

        isLoading = false;
    }

    // Function to test deleting from Strapi
    async function testDeleteOperation() {
        if (!categoryToDelete) return;

        isDeleting = true;
        deleteStatus = null;

        try {
            const response = await fetch(`${data.strapiUrl}/api/categories/${categoryToDelete}`, {
                method: 'DELETE'
            });

            const status = response.status;

            deleteStatus = {
                success: response.ok || status === 204,
                status,
                error: !response.ok && status !== 204 ? 'Failed to delete category' : null
            };
        } catch (error) {
            deleteStatus = {
                success: false,
                error: error.message
            };
        }

        isDeleting = false;
    }

    // Function to test file upload to Strapi
    async function testFileUpload() {
        if (!selectedFile) return;

        isUploading = true;
        uploadStatus = null;

        try {
            const formData = new FormData();
            formData.append('files', selectedFile);

            const response = await fetch(`${data.strapiUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const status = response.status;
            let responseData = null;

            try {
                responseData = await response.json();
            } catch (e) {
                // Handle non-JSON responses
            }

            uploadStatus = {
                success: response.ok,
                status,
                data: responseData,
                error: !response.ok ? 'Failed to upload file' : null
            };
        } catch (error) {
            uploadStatus = {
                success: false,
                error: error.message
            };
        }

        isUploading = false;
    }

    // Function to handle file selection
    function handleFileChange(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            selectedFile = files[0];
        }
    }

    // Function to refresh the page data
    function refreshPage() {
        window.location.reload();
    }
</script>

<svelte:head>
    <title>Strapi Debug Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8 flex justify-between items-center">
        <h1 class="text-3xl font-bold">Strapi Debug Dashboard</h1>
        <button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md" on:click={refreshPage}>
            Refresh Data
        </button>
    </div>

    <div class="bg-gray-100 p-4 rounded-md mb-6">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-xl font-semibold">Connection Information</h2>
                <p class="text-gray-700">URL: {data.strapiUrl}</p>
                <p class="text-gray-700">Last checked: {new Date(data.timestamp).toLocaleString()}</p>
            </div>
            <div class="text-right">
                <span
                    class={`inline-block px-3 py-1 rounded-full ${data.connectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                    {data.connectionStatus.success ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
        {#if !data.connectionStatus.success}
            <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <p class="font-semibold">Error: {data.connectionStatus.message}</p>
                {#if data.connectionStatus.error}
                    <p class="text-sm mt-1">{data.connectionStatus.error}</p>
                {/if}
            </div>
        {/if}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- API Endpoints Status -->
        <div class="bg-white shadow rounded-md overflow-hidden">
            <div class="bg-gray-50 p-4 border-b">
                <h3 class="font-semibold">API Endpoints</h3>
            </div>
            <div class="p-4">
                <ul class="divide-y">
                    {#each Object.entries(data.endpoints) as [endpoint, status]}
                        <li class="py-2">
                            <div class="flex justify-between">
                                <span>/api/{endpoint}</span>
                                <span class={status.success ? 'text-green-600' : 'text-red-600'}>
                                    {status.success ? 'OK' : 'Error'}
                                    {#if status.status}({status.status}){/if}
                                </span>
                            </div>
                            {#if status.error}
                                <p class="text-sm text-red-600 mt-1">{status.error}</p>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>

        <!-- Service Integration Status -->
        <div class="bg-white shadow rounded-md overflow-hidden">
            <div class="bg-gray-50 p-4 border-b">
                <h3 class="font-semibold">Service Integration</h3>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <p class="font-medium">getCategories():</p>
                    <span
                        class={`inline-block px-2 py-1 text-sm rounded ${data.serviceData.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                        {data.serviceData.success ? 'Success' : 'Failed'}
                    </span>
                </div>

                {#if data.serviceData.success}
                    <p class="text-sm text-gray-700">Found {data.serviceData.count} categories</p>
                {:else if data.serviceData.error}
                    <p class="text-sm text-red-600">{data.serviceData.error}</p>
                {/if}
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Write Test Section -->
        <div class="bg-white shadow rounded-md overflow-hidden">
            <div class="bg-gray-50 p-4 border-b">
                <h3 class="font-semibold">Test Write Operation</h3>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Test Category Name </label>
                    <input
                        type="text"
                        bind:value={testCategoryName}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter category name"
                    />
                </div>

                <button
                    on:click={testWriteOperation}
                    disabled={isLoading}
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:bg-indigo-300"
                >
                    {isLoading ? 'Testing...' : 'Create Test Category'}
                </button>

                {#if writeStatus}
                    <div
                        class="mt-4 p-3 rounded-md border {writeStatus.success
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'}"
                    >
                        <p class="font-semibold">
                            {writeStatus.success ? 'Success! Category created.' : 'Failed to create category.'}
                        </p>
                        {#if writeStatus.status}
                            <p class="text-sm mt-1">Status code: {writeStatus.status}</p>
                        {/if}
                        {#if writeStatus.error}
                            <p class="text-sm mt-1">Error: {writeStatus.error}</p>
                        {/if}
                        {#if writeStatus.success && writeStatus.data?.data?.documentId}
                            <p class="text-sm mt-1">Document ID: {writeStatus.data.data.documentId}</p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Delete Test Section -->
        <div class="bg-white shadow rounded-md overflow-hidden">
            <div class="bg-gray-50 p-4 border-b">
                <h3 class="font-semibold">Test Delete Operation</h3>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2"> Category ID to Delete </label>
                    <input
                        type="text"
                        bind:value={categoryToDelete}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter document ID"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                        Use the document ID from the created category or from the table below.
                    </p>
                </div>

                <button
                    on:click={testDeleteOperation}
                    disabled={isDeleting || !categoryToDelete}
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:bg-red-300"
                >
                    {isDeleting ? 'Deleting...' : 'Delete Category'}
                </button>

                {#if deleteStatus}
                    <div
                        class="mt-4 p-3 rounded-md border {deleteStatus.success
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'}"
                    >
                        <p class="font-semibold">
                            {deleteStatus.success ? 'Success! Category deleted.' : 'Failed to delete category.'}
                        </p>
                        {#if deleteStatus.status}
                            <p class="text-sm mt-1">Status code: {deleteStatus.status}</p>
                        {/if}
                        {#if deleteStatus.error}
                            <p class="text-sm mt-1">Error: {deleteStatus.error}</p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Add this new section after the grid with write/delete operations -->
    <div class="bg-white shadow rounded-md overflow-hidden mb-8">
        <div class="bg-gray-50 p-4 border-b">
            <h3 class="font-semibold">Test File Upload</h3>
        </div>
        <div class="p-4">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"> Select Image File </label>
                <input
                    type="file"
                    accept="image/*"
                    on:change={handleFileChange}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p class="text-xs text-gray-500 mt-1">Select an image file to test uploads to Strapi Media Library.</p>
            </div>

            <button
                on:click={testFileUpload}
                disabled={isUploading || !selectedFile}
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:bg-green-300"
            >
                {isUploading ? 'Uploading...' : 'Upload File'}
            </button>

            {#if uploadStatus}
                <div
                    class="mt-4 p-3 rounded-md border {uploadStatus.success
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'}"
                >
                    <p class="font-semibold">
                        {uploadStatus.success ? 'Success! File uploaded.' : 'Failed to upload file.'}
                    </p>
                    {#if uploadStatus.status}
                        <p class="text-sm mt-1">Status code: {uploadStatus.status}</p>
                    {/if}
                    {#if uploadStatus.error}
                        <p class="text-sm mt-1">Error: {uploadStatus.error}</p>
                    {/if}
                    {#if uploadStatus.success && uploadStatus.data && uploadStatus.data[0]}
                        <div class="mt-2">
                            <p class="text-sm font-medium">File details:</p>
                            <p class="text-xs">ID: {uploadStatus.data[0].id}</p>
                            <p class="text-xs">Name: {uploadStatus.data[0].name}</p>
                            <p class="text-xs">URL: {uploadStatus.data[0].url}</p>
                            {#if uploadStatus.data[0].url}
                                <div
                                    class="mt-2 w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        src={`${data.strapiUrl}${uploadStatus.data[0].url}`}
                                        alt="Uploaded preview"
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- Data Preview -->
    {#if data.serviceData.data && data.serviceData.data.length > 0}
        <div class="bg-white shadow rounded-md overflow-hidden">
            <div class="bg-gray-50 p-4 border-b">
                <h3 class="font-semibold">Categories Preview</h3>
            </div>
            <div class="p-4 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >ID</th
                            >
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >Document ID</th
                            >
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >Name</th
                            >
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >Slug</th
                            >
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >Created</th
                            >
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        {#each data.serviceData.data as category}
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{category.id || 'N/A'}</td
                                >
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                    >{category.documentId || 'N/A'}</td
                                >
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                    >{category.name || category.attributes?.name || category.Name || 'N/A'}</td
                                >
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                    >{category.slug || category.attributes?.slug || 'N/A'}</td
                                >
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {category.createdAt || category.attributes?.createdAt
                                        ? new Date(
                                              category.createdAt || category.attributes?.createdAt
                                          ).toLocaleString()
                                        : 'N/A'}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else if data.serviceData.success}
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
            <p>No categories found. Try creating one using the test form above.</p>
        </div>
    {/if}
</div>
