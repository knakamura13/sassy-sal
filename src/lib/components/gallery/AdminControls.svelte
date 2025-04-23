<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { Button } from '$lib/components/ui/button';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';

    export let isSaving: boolean = false;
    export let className: string = '';

    const dispatch = createEventDispatcher();

    let showDiscardDialog = false;

    function confirmDiscardChanges() {
        dispatch('discard');
        showDiscardDialog = false;
    }

    function saveChanges() {
        if (!isSaving) {
            dispatch('save');
        }
    }
</script>

<div class="admin-actions m-auto flex w-full max-w-screen-md justify-end space-x-4 {className}">
    <AlertDialog.Root bind:open={showDiscardDialog}>
        <AlertDialog.Trigger asChild let:builder>
            <Button variant="destructive" size="default" disabled={isSaving} builders={[builder]}>
                Discard Changes
            </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Discard Changes</AlertDialog.Title>
                <AlertDialog.Description>
                    Are you sure you want to discard your changes? This action cannot be undone.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action on:click={confirmDiscardChanges}>Discard</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>

    <Button variant="default" size="default" disabled={isSaving} on:click={saveChanges} class="flex items-center">
        {#if isSaving}
            Saving...
        {:else}
            Save Changes
        {/if}
    </Button>
</div>
