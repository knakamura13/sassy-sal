<script context="module" lang="ts">
    // Helper function to handle max width classes
    function getMaxWidth(maxWidth: string): string {
        const sizes = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
            '2xl': 'max-w-2xl',
            full: 'max-w-full'
        };

        return sizes[maxWidth] || sizes.md;
    }
</script>

<script lang="ts">
    import { Dialog as BitsDialog } from 'bits-ui';

    export let open = false;
    export let maxWidth = 'md'; // new prop for customizing width
</script>

<BitsDialog.Root bind:open>
    <BitsDialog.Portal>
        <BitsDialog.Overlay
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
        />
        <BitsDialog.Content
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] rounded-md border bg-white p-6 shadow-lg outline-none {getMaxWidth(
                maxWidth
            )}"
        >
            <div class="mb-4 flex items-center justify-between">
                <BitsDialog.Title class="text-lg font-semibold text-gray-900">
                    <slot name="title">Dialog Title</slot>
                </BitsDialog.Title>
                <BitsDialog.Close
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                    <span class="sr-only">Close</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg
                    >
                </BitsDialog.Close>
            </div>

            <slot />
        </BitsDialog.Content>
    </BitsDialog.Portal>
</BitsDialog.Root>

<style lang="scss">
    /* Combined keyframes with shared patterns */
    @keyframes fade-in-out {
        from {
            opacity: var(--opacity-from, 0);
        }
        to {
            opacity: var(--opacity-to, 1);
        }
    }

    @keyframes zoom-scale {
        from {
            opacity: var(--opacity-from, 0);
            transform: translate(-50%, calc(-50% + var(--translate-y-from, -2%))) scale(var(--scale-from, 0.95));
        }
        to {
            opacity: var(--opacity-to, 1);
            transform: translate(-50%, calc(-50% + var(--translate-y-to, 0%))) scale(var(--scale-to, 1));
        }
    }

    /* Animation utilities */
    :global(.data-[state='open']:animate-in) {
        animation-duration: 300ms;
        animation-timing-function: ease-out;
        animation-fill-mode: forwards;
    }

    :global(.data-[state='closed']:animate-out) {
        animation-duration: 200ms;
        animation-timing-function: ease-in;
        animation-fill-mode: forwards;
    }

    :global(.data-[state='open']:fade-in-0) {
        --opacity-from: 0;
        --opacity-to: 1;
        animation-name: fade-in-out;
    }

    :global(.data-[state='closed']:fade-out-0) {
        --opacity-from: 1;
        --opacity-to: 0;
        animation-name: fade-in-out;
    }

    :global(.data-[state='open']:zoom-in-95) {
        --opacity-from: 0;
        --opacity-to: 1;
        --scale-from: 0.95;
        --scale-to: 1;
        --translate-y-from: -2%;
        --translate-y-to: 0%;
        animation-name: zoom-scale;
    }

    :global(.data-[state='closed']:zoom-out-95) {
        --opacity-from: 1;
        --opacity-to: 0;
        --scale-from: 1;
        --scale-to: 0.95;
        --translate-y-from: 0%;
        --translate-y-to: -2%;
        animation-name: zoom-scale;
    }
</style>
