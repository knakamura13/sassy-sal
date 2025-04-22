<script>
    export let data;
    const { contact } = data;
</script>

<svelte:head>
    <title>{contact?.title || 'Contact'} | Photography Portfolio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-16">
    <h1 class="font-didot mb-12 text-center text-4xl">{contact.title}</h1>

    <p class="mb-6 text-center">{contact.mainContent}</p>

    <p class="text-center">
        <a href="mailto:{contact.email}" class="link link--zoomies">{contact.email}</a>
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
