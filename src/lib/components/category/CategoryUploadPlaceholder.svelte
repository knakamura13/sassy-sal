<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { uploadFile } from '$lib/services/strapi';
    import * as Dialog from '$lib/components/ui/dialog';

    // Define interface for Strapi uploaded file
    interface StrapiUploadedFile {
        id: number;
        name: string;
        url: string;
    }

    // Define the data structure that will be sent to Strapi
    interface CategoryData {
        data: {
            name: string;
            slug: string;
            description?: string;
            thumbnail?: {
                connect: [{ id: number }];
            };
        };
    }

    const dispatch = createEventDispatcher<{ addCategory: CategoryData }>();

    let open = false;
    let categoryName = '';
    let categoryDescription = '';
    let selectedFile: File | null = null;
    let imagePreview = '';
    let isUploading = false;
    let errorMessage = '';

    // Reset form data when the dialog is closed
    $: if (!open) {
        resetForm();
    }

    function resetForm() {
        categoryName = '';
        categoryDescription = '';
        selectedFile = null;
        imagePreview = '';
        isUploading = false;
        errorMessage = '';
    }

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedFile = input.files[0];

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(selectedFile);
        }
    }

    async function handleSubmit() {
        if (!categoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        isUploading = true;
        errorMessage = '';

        try {
            // Create a slug from the category name
            const slug = categoryName
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');

            // Prepare the data for Strapi
            const categoryData: CategoryData = {
                data: {
                    name: categoryName.trim(),
                    slug,
                    description: categoryDescription.trim() || undefined
                }
            };

            // If there's a selected file, upload it first
            if (selectedFile) {
                try {
                    const uploadedFile = (await uploadFile(selectedFile)) as StrapiUploadedFile;

                    if (uploadedFile && uploadedFile.id) {
                        // Add the thumbnail ID to the category data using Strapi v4 relationship format
                        categoryData.data.thumbnail = {
                            connect: [{ id: uploadedFile.id }]
                        };
                    }
                } catch (uploadError) {
                    // Continue without the thumbnail if upload fails
                    errorMessage = 'Failed to upload thumbnail, but category will be created without it.';
                }
            }

            // Dispatch the event to create the category
            dispatch('addCategory', categoryData);
            open = false; // Close dialog after successful submission
        } catch (error) {
            console.error('❌ Error creating category:', error);
            errorMessage = 'Failed to create category. Please try again.';
        } finally {
            isUploading = false;
        }
    }
</script>

<div class="aspect-[3/4] !m-auto block transition-all duration-300 h-full border-dashed border-2 border-gray-300">
    <Dialog.Root bind:open>
        <Dialog.Trigger
            class="w-full h-full flex flex-col items-center justify-center p-4 transition-colors hover:bg-gray-100"
        >
            <div class="text-3xl text-gray-400 mb-2">+</div>
            <div class="font-didot text-gray-500 font-medium">Add Category</div>
        </Dialog.Trigger>

        <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
                <Dialog.Title>Add New Category</Dialog.Title>
            </Dialog.Header>

            <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">
                <div>
                    <label class="block font-garamond text-sm font-medium mb-1" for="categoryName">
                        Category Name*
                    </label>
                    <input
                        type="text"
                        id="categoryName"
                        class="font-garamond w-full px-3 py-2 border border-gray-300 rounded-md"
                        bind:value={categoryName}
                        placeholder="e.g. Weddings"
                        required
                        disabled={isUploading}
                    />
                </div>

                <div>
                    <label class="block font-garamond text-sm font-medium mb-1" for="categoryDescription">
                        Description
                    </label>
                    <input
                        type="text"
                        id="categoryDescription"
                        class="font-garamond w-full px-3 py-2 border border-gray-300 rounded-md"
                        bind:value={categoryDescription}
                        placeholder="Short description"
                        disabled={isUploading}
                    />
                </div>

                <div>
                    <label
                        class="block font-garamond text-sm font-medium mb-1 w-[fit-content] mr-auto"
                        for="categoryImage"
                    >
                        Thumbnail Image
                    </label>
                    <input
                        type="file"
                        id="categoryImage"
                        accept="image/*"
                        class="font-garamond w-full px-3 py-2 border border-gray-300 rounded-md"
                        on:change={handleFileChange}
                        disabled={isUploading}
                    />
                    {#if imagePreview}
                        <div
                            class="mt-2 w-full h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden"
                        >
                            <img src={imagePreview} alt="Preview" class="h-full w-auto object-cover" />
                        </div>
                    {/if}
                </div>

                {#if errorMessage}
                    <div class="p-2 bg-red-100 text-red-800 rounded text-sm">
                        {errorMessage}
                    </div>
                {/if}

                <Dialog.Footer class="sm:justify-end">
                    <div class="flex space-x-3">
                        <Dialog.Close
                            class="font-didot px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer"
                        >
                            Cancel
                        </Dialog.Close>

                        <button
                            type="submit"
                            class="font-didot px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer flex items-center justify-center"
                            disabled={isUploading}
                        >
                            {#if isUploading}
                                <span class="mr-2">Creating...</span>
                                <!-- Simple loading spinner -->
                                <div
                                    class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                ></div>
                            {:else}
                                Add
                            {/if}
                        </button>
                    </div>
                </Dialog.Footer>
            </form>
        </Dialog.Content>
    </Dialog.Root>
</div>
