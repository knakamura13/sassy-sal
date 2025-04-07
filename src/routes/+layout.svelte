<script lang="ts">
    import '../app.postcss';
    import './styles.scss';
    import Header from '$lib/components/Header.svelte';
    import { Toaster } from '$lib/components/ui/sonner';
</script>

<div class="app-wrapper flex flex-col">
    <Header />
    <main class="main-content flex-1">
        <slot />
    </main>
    <Toaster />
</div>

<style>
    /* Reset all conflicting styles */
    :global(html),
    :global(body) {
        margin: 0;
        padding: 0;
        min-height: 100%;
        width: 100%;
        overflow-x: hidden !important;
    }

    /* Critical: ensure body is scrollable */
    :global(body) {
        position: relative;
        overflow-y: auto !important;
        height: auto !important;
    }

    /* Make sure content container doesn't override scroll */
    :global(.app-wrapper) {
        position: relative;
        min-height: auto;
    }
</style>
