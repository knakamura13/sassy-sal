<div class="flex flex-col justify-center items-center container m-auto px-4 py-12 max-w-2xl min-h-[50vh]">
    <h1 class="text-3xl font-didot mb-8 text-center">Contact</h1>

    <p class="text-center mb-6">Lifestyle, headshot, engagement, and event photography.</p>

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
