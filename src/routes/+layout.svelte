<script lang="ts">
    import '../app.postcss';
    import './styles.scss';
    import Header from '$lib/components/Header.svelte';
</script>

<div class="app-wrapper">
    <Header></Header>
    <main class="main-content">
        <slot />
    </main>
</div>

<style lang="scss">
    .app-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .main-content {
        flex: 1;
    }
</style>
