<script lang="ts">
    import { Dialog as BitsDialog } from 'bits-ui';

    export let open = false;
</script>

<BitsDialog.Root bind:open>
    <BitsDialog.Portal>
        <BitsDialog.Overlay
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80"
        />
        <BitsDialog.Content
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 shadow-lg border outline-none"
        >
            <div class="mb-4 flex justify-between items-center">
                <BitsDialog.Title class="text-lg font-semibold text-gray-900">
                    <slot name="title">Dialog Title</slot>
                </BitsDialog.Title>
                <BitsDialog.Close
                    class="rounded-full h-6 w-6 inline-flex items-center justify-center text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                    <span class="sr-only">Close</span>
                    ×
                </BitsDialog.Close>
            </div>

            <slot />
        </BitsDialog.Content>
    </BitsDialog.Portal>
</BitsDialog.Root>

<style lang="scss">
    /* Animation keyframes for dialog */
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fade-out {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    @keyframes zoom-in-95 {
        from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    @keyframes zoom-out-95 {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.95);
        }
    }

    /* Animation utilities for dialog */
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
        animation-name: fade-in;
    }

    :global(.data-[state='closed']:fade-out-0) {
        animation-name: fade-out;
    }

    :global(.data-[state='open']:zoom-in-95) {
        animation-name: zoom-in-95;
    }

    :global(.data-[state='closed']:zoom-out-95) {
        animation-name: zoom-out-95;
    }
</style>
