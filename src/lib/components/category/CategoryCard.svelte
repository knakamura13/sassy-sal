<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { IMAGE_SIZES } from '$lib/services/imageConfig';
    import CategoryDialog from './CategoryDialog.svelte';

    interface SanityCategory {
        id: string | number;
        attributes: {
            name: string;
            order: number;
            passwordProtected?: boolean;
            thumbnail?: {
                data?: {
                    attributes?: {
                        url?: string;
                        placeholderUrl?: string;
                        thumbnailUrl?: string;
                        fullSizeUrl?: string;
                        width?: number;
                        height?: number;
                    };
                };
            };
        };
    }

    export let category: SanityCategory;
    export let isAdmin: boolean = false;
    /** Home LCP candidate: fetchpriority=high. Category thumbs always load eagerly. */
    export let priority: boolean = false;

    const dispatch = createEventDispatcher<{
        remove: string | number;
        update: { id: string | number; data: any };
    }>();

    let placeholderUrl = '';
    let thumbnailUrl = '';
    let fullSizeUrl = '';

    let editDialogOpen = false;

    $: categoryId = category?.id || 'placeholder';
    $: categoryName = category?.attributes?.name || 'Missing Category';
    $: categoryThumbnail = category?.attributes?.thumbnail;

    $: {
        placeholderUrl = '';
        thumbnailUrl = '';
        fullSizeUrl = '';

        if (categoryThumbnail?.data?.attributes) {
            const attrs = categoryThumbnail.data.attributes;
            placeholderUrl = attrs.placeholderUrl || '';
            thumbnailUrl = attrs.url || '';
            fullSizeUrl = attrs.fullSizeUrl || attrs.url || '';
        } else if (typeof categoryThumbnail === 'string') {
            thumbnailUrl = categoryThumbnail;
            fullSizeUrl = categoryThumbnail;
            placeholderUrl = '';
        }
    }

    $: isBlob = thumbnailUrl.startsWith('blob:');
    $: displaySrc = thumbnailUrl || placeholderUrl;
    $: srcset =
        !isBlob && thumbnailUrl && fullSizeUrl && fullSizeUrl !== thumbnailUrl
            ? `${thumbnailUrl} ${IMAGE_SIZES.MEDIUM.width}w, ${fullSizeUrl} ${IMAGE_SIZES.LARGE.width}w`
            : undefined;
    let fetchPriority: 'high' | 'auto' = 'auto';
    $: fetchPriority = priority ? 'high' : 'auto';

    function handleRemove(e: Event) {
        e.preventDefault();
        dispatch('remove', categoryId);
    }

    function handleEdit(e: Event) {
        e.preventDefault();
        editDialogOpen = true;
    }

    function handleUpdate(event: CustomEvent<{ id: string | number; data: any }>) {
        dispatch('update', event.detail);

        if (category && category.attributes && event.detail.data.data) {
            const data = event.detail.data.data;
            if (data.name) {
                category.attributes.name = data.name;
            }
            if (typeof data.order === 'number') {
                category.attributes.order = data.order;
            }
        }
    }
</script>

<a
    href={
        String(categoryId).startsWith('temp-')
            ? '#'
            : `/${categoryName.toLowerCase().replace(/\s+/g, '-')}`
    }
    class="category-card group relative block h-full w-full overflow-hidden shadow-md transition-all duration-300 hover:scale-[1.01] hover:shadow-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#d19177]"
    class:pointer-events-none={String(categoryId).startsWith('temp-')}
    aria-label="View {categoryName} gallery{category.attributes.passwordProtected && !isAdmin ? ' (password protected)' : ''}"
>
    <div
        class="category-card-border pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
    ></div>
    <div class="relative h-full w-full">
        {#if String(categoryId).startsWith('temp-')}
            <div class="absolute left-0 right-0 top-0 z-10 bg-blue-600 px-2 py-1 text-center text-xs text-white">
                Saving...
            </div>
        {/if}
        {#if displaySrc}
            <img
                src={displaySrc}
                {srcset}
                sizes="(min-width: 768px) 50vw, 100vw"
                alt=""
                class="relative h-full w-full object-cover"
                loading="eager"
                fetchpriority={fetchPriority}
                decoding="async"
            />
        {:else}
            <div
                class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200"
            >
                <div class="text-center text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <p class="mt-2 text-xs">No image</p>
                </div>
            </div>
        {/if}

        {#if category.attributes.passwordProtected && !isAdmin}
            <div class="absolute left-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white" aria-hidden="true">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" role="img">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                </svg>
            </div>
        {/if}

        <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4 text-white transition-opacity duration-300 group-hover:opacity-0"
        >
            <h2 class="text-right text-2xl font-medium tracking-wide">
                {categoryName}
                {#if category.attributes.passwordProtected && !isAdmin}
                    <span class="ml-2 text-lg">🔒</span>
                {/if}
            </h2>
        </div>

        {#if isAdmin}
            <div class="absolute right-0 top-0 z-10 flex space-x-1 bg-gray-900 bg-opacity-60 p-1 shadow-lg">
                <button
                    type="button"
                    class="aspect-square h-10 w-10 p-1 text-white hover:bg-gray-600"
                    on:click|stopPropagation={handleEdit}
                    aria-label="Edit category"
                >
                    ✎
                </button>
                <button
                    type="button"
                    class="aspect-square h-10 w-10 p-1 text-white hover:bg-red-600"
                    on:click|stopPropagation={handleRemove}
                    aria-label="Remove category"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</a>

<CategoryDialog bind:open={editDialogOpen} mode="edit" {category} currentDisplayedUrl={displaySrc} on:update={handleUpdate} />
