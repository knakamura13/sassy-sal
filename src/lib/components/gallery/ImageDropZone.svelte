<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import FileDropZone from '$lib/components/common/FileDropZone.svelte';

    // Props
    export let selectedFiles: File[] = [];
    export let previewUrls: string[] = [];

    const dispatch = createEventDispatcher<{ filesSelected: File[] }>();

    function handleFilesSelected(event: CustomEvent<File[]>) {
        dispatch('filesSelected', event.detail);
    }
</script>

<FileDropZone
    {selectedFiles}
    {previewUrls}
    multiple={true}
    placeholderText="Drop images here"
    browseText="or click to browse"
    on:filesSelected={handleFilesSelected}
/>
