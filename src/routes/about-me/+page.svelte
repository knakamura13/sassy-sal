<script>
    export let data;
    const { aboutMe } = data;

    import { PortableText } from '@portabletext/svelte';
    import { urlFor } from '$lib/utils/image';
</script>

<svelte:head>
    <title>{aboutMe?.title || 'About Me'} | Photography Portfolio</title>
</svelte:head>

<div class="container mx-auto max-w-[1400px] px-4 py-16">
    <h1 class="font-didot mb-12 text-center text-4xl">{aboutMe.title}</h1>

    <div class="flex flex-col items-center gap-8 md:flex-row md:items-start">
        {#if aboutMe.profileImage}
            <div class="w-full md:w-1/2 lg:w-2/5">
                <img
                    src={urlFor(aboutMe.profileImage).width(600).auto('format').url()}
                    alt="Profile"
                    class="h-auto w-full rounded-lg shadow-md"
                />
            </div>
        {/if}

        <div class="w-full {aboutMe.profileImage ? 'md:w-1/2 lg:w-3/5' : 'mx-auto md:w-3/4'} prose">
            <PortableText value={aboutMe.mainContent} />

            <p class="mt-6 text-center md:text-left">
                <a href="mailto:{aboutMe.email}" class="link link--zoomies">{aboutMe.email}</a>
            </p>
        </div>
    </div>
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

    :global(.prose p) {
        margin-bottom: 1rem;
    }
</style>
