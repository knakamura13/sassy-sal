<script lang="ts">
    import { urlFor } from '$lib/sanity';
    import { PortableText } from '@portabletext/svelte';

    export let data;
    const { about } = data;
</script>

<div class="container mx-auto max-w-4xl px-4 py-16">
    <h1 class="font-didot mb-12 text-center text-4xl">{about?.title || 'About Me'}</h1>

    <div class="mb-16 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        {#if about?.photographerImage?.asset?._ref}
            {@const imgUrl = urlFor(about.photographerImage)}
            {#if imgUrl !== ''}
                <div class="aspect-square overflow-hidden rounded-lg">
                    <img
                        src={imgUrl.width(600).height(600).auto('format').url()}
                        alt="Sally - Professional Photographer"
                        class="h-full w-full object-cover"
                    />
                </div>
            {/if}
        {/if}

        {#if about?.mainContent}
            <div class="prose prose-sm max-w-none space-y-2">
                <PortableText value={about.mainContent} components={{}} />
            </div>
        {/if}
    </div>

    <div class="mb-16 rounded-lg bg-gray-50 p-8">
        <h2 class="font-didot mb-6 text-center text-2xl font-semibold">
            {about?.myApproach?.sectionTitle || 'My Approach'}
        </h2>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
            {#if about?.myApproach?.columns?.length}
                {#each about.myApproach.columns as column}
                    <div class="text-center">
                        {#if column.icon?.asset?._ref}
                            {@const iconUrl = urlFor(column.icon)}
                            {#if iconUrl !== ''}
                                <div
                                    class="pointer-events-none mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
                                >
                                    <img
                                        src={iconUrl.width(40).height(40).auto('format').url()}
                                        alt={column.title}
                                        class="pointer-events-none h-8 w-8"
                                    />
                                </div>
                            {:else}
                                <div class="mx-auto mb-4 flex h-16 w-16"></div>
                            {/if}
                        {:else}
                            <div class="mx-auto mb-4 flex h-16 w-16"></div>
                        {/if}
                        <h3 class="text-lg font-semibold">{column.title}</h3>
                        <p class="text-gray-600">{column.description}</p>
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <div class="text-center">
        <h2 class="font-didot mb-6 text-2xl">Ready to work together?</h2>
        <a
            href="/contact"
            class="inline-block rounded-full bg-gray-800 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
        >
            Get in touch
        </a>
    </div>
</div>

<style lang="scss">
    @use '../../lib/styles/variables' as vars;
    @use 'sass:color';

    h1,
    h2,
    h3 {
        color: vars.$primary-color;
    }

    a {
        &:hover {
            background-color: vars.$secondary-color;
        }
    }
</style>
