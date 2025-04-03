<script>
    import { onMount } from 'svelte';
    import { diagnoseRelationships } from '$lib/services/strapi';

    let diagnosisResult = null;
    let isLoading = false;
    let consoleOutput = [];

    // Override console.log to capture output
    onMount(() => {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        // Override console methods to capture output
        console.log = function (...args) {
            originalConsoleLog.apply(console, args);
            const message = args
                .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(' ');
            consoleOutput = [...consoleOutput, { type: 'log', message }];
        };

        console.error = function (...args) {
            originalConsoleError.apply(console, args);
            const message = args
                .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(' ');
            consoleOutput = [...consoleOutput, { type: 'error', message }];
        };

        return () => {
            // Restore original console methods
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
        };
    });

    async function runDiagnostics() {
        isLoading = true;
        consoleOutput = [];

        try {
            diagnosisResult = await diagnoseRelationships();
        } catch (error) {
            console.error('Error running diagnostics:', error);
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Strapi Relationship Diagnostics</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Strapi Relationship Diagnostics</h1>

    <div class="mb-6">
        <p class="text-gray-700 mb-4">
            This tool will analyze your Strapi relationship structure to help diagnose why images are not properly
            linked to categories.
        </p>

        <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors {isLoading
                ? 'opacity-50 cursor-wait'
                : ''}"
            on:click={runDiagnostics}
            disabled={isLoading}
        >
            {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
    </div>

    {#if diagnosisResult}
        <div
            class="mb-6 p-4 border rounded {diagnosisResult.success
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'}"
        >
            <h2 class="text-xl font-semibold mb-2">Diagnosis Result</h2>
            <p class="mb-2">{diagnosisResult.message}</p>

            {#if diagnosisResult.relationStructure}
                <div class="mt-4">
                    <h3 class="font-medium mb-2">Relationship Structure:</h3>
                    <pre class="p-3 bg-gray-100 rounded overflow-auto max-h-40">{JSON.stringify(
                            diagnosisResult.relationStructure,
                            null,
                            2
                        )}</pre>
                </div>
            {/if}
        </div>
    {/if}

    <div class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Console Output</h2>
        <div class="p-4 bg-gray-800 text-white rounded overflow-auto max-h-96">
            {#if consoleOutput.length === 0}
                <p class="text-gray-400">Run diagnostics to see output...</p>
            {:else}
                {#each consoleOutput as output}
                    <div class="mb-1 font-mono text-sm {output.type === 'error' ? 'text-red-400' : 'text-green-300'}">
                        {output.message}
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <div class="mt-8">
        <h2 class="text-xl font-semibold mb-4">Recommendation</h2>
        <div class="p-4 border border-blue-200 bg-blue-50 rounded">
            <p class="mb-2">
                Based on the diagnostic results, there may be several reasons why the bidirectional relationship isn't
                working:
            </p>
            <ol class="list-decimal pl-5 space-y-2">
                <li>
                    The relationship in Strapi Content Types might be configured incorrectly (one-way instead of
                    bidirectional)
                </li>
                <li>Permissions might be restricting updates to the category from the front-end</li>
                <li>The API format for updating relations could be specific to your Strapi version</li>
            </ol>
            <p class="mt-4">
                <strong>Next steps:</strong> Check your Strapi content type builder, verify that the relationship between
                Categories and Images is set to bidirectional (many-to-many or one-to-many), and ensure your permissions
                allow updating category relations.
            </p>
        </div>
    </div>
</div>
