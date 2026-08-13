<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import type { Image } from '$lib/stores/imageStore';

    export let image: Image | null = null;
    export let show: boolean = false;

    const dispatch = createEventDispatcher();

    let dialogEl: HTMLDialogElement | undefined;
    let closeBtn: HTMLButtonElement | undefined;

    $: previewLabel = image
        ? `Full-size preview of ${image.alt || image.title || 'image'}`
        : 'Image preview';
    $: imageAlt =
        image?.alt && image.alt !== 'Gallery image' && image.alt !== 'Image preview'
            ? image.alt
            : image?.title || '';
    $: dialogOpen = show && !!image;

    onMount(() => {
        return () => {
            document.body.classList.remove('modal-open');
        };
    });

    $: if (typeof document !== 'undefined' && dialogEl) {
        syncDialog(dialogOpen);
    }

    async function syncDialog(open: boolean) {
        if (!dialogEl) return;

        if (open) {
            document.body.classList.add('modal-open');
            if (!dialogEl.open) {
                dialogEl.showModal();
                await tick();
                closeBtn?.focus();
            }
        } else if (dialogEl.open) {
            dialogEl.close();
        }
    }

    function requestClose() {
        dispatch('close');
    }

    function handleDialogClose() {
        document.body.classList.remove('modal-open');
        if (show) {
            dispatch('close');
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === dialogEl) {
            requestClose();
        }
    }

    function trapFocus(event: KeyboardEvent) {
        if (!dialogOpen || event.key !== 'Tab' || !dialogEl) return;

        const focusable = Array.from(
            dialogEl.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => el.tabIndex !== -1);

        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
</script>

<dialog
    bind:this={dialogEl}
    class="lightbox-dialog"
    aria-label={previewLabel}
    on:close={handleDialogClose}
    on:cancel|preventDefault={requestClose}
    on:click={handleBackdropClick}
    on:keydown={trapFocus}
>
    {#if image}
        <button
            bind:this={closeBtn}
            type="button"
            class="lightbox-close"
            aria-label="Close preview"
            on:click={requestClose}
        >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>

        <span class="lightbox-frame">
            <img src={image.fullSizeUrl} alt={imageAlt} class="h-full w-full object-contain" />
        </span>
    {/if}
</dialog>

<style>
    .lightbox-dialog {
        max-width: 95vw;
        max-height: 95vh;
        width: 100%;
        height: 100%;
        margin: auto;
        border: 0;
        padding: 1rem;
        background: transparent;
        overflow: hidden;
        color: #fff;
    }

    .lightbox-dialog::backdrop {
        background: rgb(0 0 0 / 0.85);
        backdrop-filter: blur(4px);
    }

    .lightbox-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.75rem;
        height: 2.75rem;
        border: 0;
        border-radius: 9999px;
        background: rgb(0 0 0 / 0.4);
        color: #fff;
        cursor: pointer;
    }

    .lightbox-close:hover {
        background: rgb(0 0 0 / 0.6);
        transform: scale(1.1);
    }

    .lightbox-close:focus {
        outline: none;
    }

    .lightbox-close:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
    }

    .lightbox-frame {
        display: block;
        position: relative;
        height: 100%;
        max-height: 95vh;
        width: 100%;
        max-width: 95vw;
        overflow: hidden;
    }
</style>
