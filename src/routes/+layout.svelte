<script lang="ts">
    import '../app.postcss';
    import './styles.scss';
    import Header from '$lib/components/Header.svelte';
</script>

<div class="app-wrapper flex flex-col min-h-[100vh]">
    <Header></Header>
    <main class="main-content flex-1">
        <slot />
    </main>
</div>
