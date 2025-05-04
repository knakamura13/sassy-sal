<script>
    export let data;
    const { aboutMe } = data;
</script>

<svelte:head>
    <title>{aboutMe?.title || 'About Me'} | Photography Portfolio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-16">
    <h1 class="font-didot mb-12 text-center text-4xl">{aboutMe.title}</h1>

    <p class="mb-6 text-center">{aboutMe.mainContent}</p>

    <p class="text-center">
        <a href="mailto:{aboutMe.email}" class="link link--zoomies">{aboutMe.email}</a>
    </p>
</div>

<style lang="scss">
    @use '../../lib/styles/variables' as vars;
    @use 'sass:color';

    a {
        color: vars.$secondary-color;

        &:hover {
            color: color.adjust(vars.$secondary-color, $lightness: -10%);
        }
    }
</style>
