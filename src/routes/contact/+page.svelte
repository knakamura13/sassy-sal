<div class="container m-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-12">
    <h1 class="font-didot mb-8 text-center text-3xl">Contact</h1>

    <p class="mb-6 text-center">Lifestyle, headshot, engagement, and event photography.</p>

    <p class="text-center">
        <a href="mailto:sallyjkphoto@gmail.com" class="link link--zoomies">sallyjkphoto@gmail.com</a>
    </p>
</div>

<style lang="scss">
    @use '$lib/styles/variables' as vars;
    @use 'sass:color';

    a {
        color: vars.$secondary-color;

        &:hover {
            color: color.adjust(vars.$secondary-color, $lightness: -10%);
        }
    }
</style>
