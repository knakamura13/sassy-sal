<script lang="ts">
    import { onMount } from 'svelte';
    import { preloadData } from '$app/navigation';

    export let nextCategory: { id: string; name: string } | null = null;

    const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');
    let href = nextCategory ? `/${slugify(nextCategory.name)}` : '';

    onMount(() => {
        if (href) preloadData(href).catch(() => {});
    });

    $: {
        href = nextCategory ? `/${slugify(nextCategory.name)}` : '';
        if (href) preloadData(href).catch(() => {});
    }
</script>

{#if nextCategory}
    <div class="next-category-nav mt-12 flex w-full justify-end">
        <a
            href="/{nextCategory.name.toLowerCase().replace(/\s+/g, '-')}"
            class="link link--zoomies flex flex-row items-center gap-1 !text-2xl !text-[#d19177]"
            data-sveltekit-preload-data
        >
            {nextCategory.name}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
        </a>
    </div>
{/if}
