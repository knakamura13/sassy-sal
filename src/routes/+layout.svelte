<script lang="ts">
    import '../app.postcss';
    import './styles.scss';
    import Header from '$lib/components/Header.svelte';
    import { Toaster } from '$lib/components/ui/sonner';
    import AdminEasterEgg from '$lib/components/AdminEasterEgg.svelte';
</script>

<!-- No title set in the layout - this allows page components to set their own titles -->

<div class="app-wrapper flex flex-col">
    <Header />

    <main class="main-content flex-1">
        <slot />
    </main>

    <Toaster />
    <AdminEasterEgg />
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
