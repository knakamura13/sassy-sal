<script lang="ts">
    import '../app.postcss';
    import './styles.scss';
    import Header from '$lib/components/Header.svelte';
    import { Toaster } from '$lib/components/ui/sonner';
    import AdminEasterEgg from '$lib/components/AdminEasterEgg.svelte';
</script>

<!-- No title set in the layout - this allows page components to set their own titles -->

<a href="#main-content" class="skip-link">Skip to content</a>

<div class="app-wrapper flex flex-col">
    <Header />

    <main id="main-content" class="main-content mx-auto w-full max-w-[1400px] flex-1" tabindex="-1">
        <slot />
    </main>

    <Toaster />
    <AdminEasterEgg />
</div>

<style>
    /* Skip-to-content link for keyboard/screen-reader users */
    :global(.skip-link) {
        position: absolute;
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        padding: 0.75rem 1.5rem;
        background: #333f40;
        color: #fff;
        font-family: 'Garamond Libre', serif;
        font-size: 1rem;
        text-decoration: none;
        border-radius: 0 0 0.5rem 0.5rem;
        transition: top 0.2s ease;
    }

    :global(.skip-link:focus) {
        top: 0;
        outline: 3px solid #d19177;
        outline-offset: 2px;
    }

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
