<script>
    export let data;

    // Handle potential missing data gracefully
    $: aboutMe = data?.aboutMe || {
        title: 'About Me',
        mainContent: [],
        contactForm: {
            formHeader: 'Get in touch',
            formFields: {},
            submitButtonText: 'Send Message'
        },
        email: '',
        footerTagline: ''
    };

    import { PortableText } from '@portabletext/svelte';
    import { urlFor } from '$lib/utils/image';
    import { adminMode } from '$lib/stores/adminStore';

    // Set admin mode based on server-side authentication from layout
    $: if (data.admin) {
        adminMode.set(true);
    } else {
        adminMode.set(false);
    }

    // Form state
    let formSubmitting = false;
    let formSuccess = false;
    let formError = null;

    // Generic editing state
    let isEditing = {
        title: false,
        formHeader: false,
        footerTagline: false,
        email: false
    };
    let editedValues = {
        title: '',
        formHeader: '',
        footerTagline: '',
        email: ''
    };
    let updateLoading = {
        title: false,
        formHeader: false,
        footerTagline: false,
        email: false
    };

    // Form data
    let formData = {
        name: '',
        email: '',
        phone: '',
        referral: '',
        message: ''
    };

    // Handle title edit start
    function startEditingTitle() {
        isEditing.title = true;
        editedValues.title = aboutMe.title;
    }

    // Handle title edit cancel
    function cancelEditingTitle() {
        isEditing.title = false;
        editedValues.title = '';
    }

    // Handle title update
    async function updateTitle() {
        if (!editedValues.title.trim() || editedValues.title === aboutMe.title) {
            cancelEditingTitle();
            return;
        }

        // Check if user is in admin mode before making API call
        if (!$adminMode) {
            console.warn('Cannot update title: not in admin mode');
            cancelEditingTitle();
            return;
        }

        updateLoading.title = true;

        try {
            const response = await fetch('/api/sanity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'updateAboutMe',
                    data: {
                        id: aboutMe._id,
                        updates: {
                            title: editedValues.title.trim()
                        }
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Update the local aboutMe object
                aboutMe.title = editedValues.title.trim();
                isEditing.title = false;
                editedValues.title = '';
            } else if (response.status === 403) {
                console.error('Unauthorized to update title');
                // Reset admin mode if we get 403
                adminMode.set(false);
                cancelEditingTitle();
            } else {
                console.error('Failed to update title');
            }
        } catch (error) {
            console.error('Error updating title:', error);
        } finally {
            updateLoading.title = false;
        }
    }

    // Handle form header editing
    function startEditingFormHeader() {
        isEditing.formHeader = true;
        editedValues.formHeader = aboutMe.contactForm.formHeader || '';
    }

    function cancelEditingFormHeader() {
        isEditing.formHeader = false;
        editedValues.formHeader = '';
    }

    async function updateFormHeader() {
        if (editedValues.formHeader === (aboutMe.contactForm.formHeader || '')) {
            cancelEditingFormHeader();
            return;
        }

        // Check if user is in admin mode before making API call
        if (!$adminMode) {
            console.warn('Cannot update form header: not in admin mode');
            cancelEditingFormHeader();
            return;
        }

        updateLoading.formHeader = true;

        try {
            const response = await fetch('/api/sanity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'updateAboutMe',
                    data: {
                        id: aboutMe._id,
                        updates: {
                            'contactForm.formHeader': editedValues.formHeader.trim()
                        }
                    }
                })
            });

            if (response.ok) {
                aboutMe.contactForm.formHeader = editedValues.formHeader.trim();
                isEditing.formHeader = false;
                editedValues.formHeader = '';
            } else if (response.status === 403) {
                console.error('Unauthorized to update form header');
                adminMode.set(false);
                cancelEditingFormHeader();
            } else {
                console.error('Failed to update form header');
            }
        } catch (error) {
            console.error('Error updating form header:', error);
        } finally {
            updateLoading.formHeader = false;
        }
    }

    // Handle footer tagline editing
    function startEditingFooterTagline() {
        isEditing.footerTagline = true;
        editedValues.footerTagline = aboutMe.footerTagline || '';
    }

    function cancelEditingFooterTagline() {
        isEditing.footerTagline = false;
        editedValues.footerTagline = '';
    }

    async function updateFooterTagline() {
        if (editedValues.footerTagline === (aboutMe.footerTagline || '')) {
            cancelEditingFooterTagline();
            return;
        }

        // Check if user is in admin mode before making API call
        if (!$adminMode) {
            console.warn('Cannot update footer tagline: not in admin mode');
            cancelEditingFooterTagline();
            return;
        }

        updateLoading.footerTagline = true;

        try {
            const response = await fetch('/api/sanity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'updateAboutMe',
                    data: {
                        id: aboutMe._id,
                        updates: {
                            footerTagline: editedValues.footerTagline.trim()
                        }
                    }
                })
            });

            if (response.ok) {
                aboutMe.footerTagline = editedValues.footerTagline.trim();
                isEditing.footerTagline = false;
                editedValues.footerTagline = '';
            } else if (response.status === 403) {
                console.error('Unauthorized to update footer tagline');
                adminMode.set(false);
                cancelEditingFooterTagline();
            } else {
                console.error('Failed to update footer tagline');
            }
        } catch (error) {
            console.error('Error updating footer tagline:', error);
        } finally {
            updateLoading.footerTagline = false;
        }
    }

    // Handle email editing
    function startEditingEmail() {
        isEditing.email = true;
        editedValues.email = aboutMe.email || '';
    }

    function cancelEditingEmail() {
        isEditing.email = false;
        editedValues.email = '';
    }

    async function updateEmail() {
        if (editedValues.email === (aboutMe.email || '')) {
            cancelEditingEmail();
            return;
        }

        // Check if user is in admin mode before making API call
        if (!$adminMode) {
            console.warn('Cannot update email: not in admin mode');
            cancelEditingEmail();
            return;
        }

        updateLoading.email = true;

        try {
            const response = await fetch('/api/sanity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'updateAboutMe',
                    data: {
                        id: aboutMe._id,
                        updates: {
                            email: editedValues.email.trim()
                        }
                    }
                })
            });

            if (response.ok) {
                aboutMe.email = editedValues.email.trim();
                isEditing.email = false;
                editedValues.email = '';
            } else if (response.status === 403) {
                console.error('Unauthorized to update email');
                adminMode.set(false);
                cancelEditingEmail();
            } else {
                console.error('Failed to update email');
            }
        } catch (error) {
            console.error('Error updating email:', error);
        } finally {
            updateLoading.email = false;
        }
    }

    // Handle form submission
    async function handleSubmit() {
        formSubmitting = true;
        formSuccess = false;
        formError = null;

        try {
            const response = await fetch('/api/about-me', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    referral: formData.referral,
                    message: formData.message,
                    subject: 'New contact form submission - Photography Website'
                })
            });

            const result = await response.json();

            if (response.ok) {
                formSuccess = true;
                // Reset form
                formData = {
                    name: '',
                    email: '',
                    phone: '',
                    referral: '',
                    message: ''
                };
            } else {
                formError = result.error || 'Failed to send message. Please try again.';
            }
        } catch (error) {
            console.error('Contact form error:', error);
            formError = 'An unexpected error occurred. Please try again later.';
        } finally {
            formSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>{aboutMe?.title || 'About Me'} | Photography Portfolio</title>
</svelte:head>

<div class="container mx-auto flex max-w-screen-lg flex-col gap-12 px-4 py-16 pb-32">
    <div class="relative flex items-center justify-center gap-3">
        {#if isEditing.title}
            <input
                type="text"
                bind:value={editedValues.title}
                class="title-input font-didot border-b-2 border-gray-300 bg-transparent text-center text-4xl focus:border-blue-500 focus:outline-none"
                on:keydown={(e) => {
                    if (e.key === 'Enter') {
                        updateTitle();
                    } else if (e.key === 'Escape') {
                        cancelEditingTitle();
                    }
                }}
                on:blur={updateTitle}
            />
            <button
                type="button"
                on:click={updateTitle}
                disabled={updateLoading.title}
                class="admin-icon checkmark-icon"
                aria-label="Save title"
            >
                {#if updateLoading.title}
                    <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                {:else}
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                {/if}
            </button>
        {:else}
            <h1 class="font-didot mb-4 text-center text-4xl">{aboutMe.title}</h1>
            {#if $adminMode}
                <button
                    type="button"
                    on:click={startEditingTitle}
                    class="admin-icon pencil-icon"
                    aria-label="Edit title"
                >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                </button>
            {/if}
        {/if}
    </div>

    <div class="flex flex-col items-center gap-8 md:flex-row md:items-start">
        {#if aboutMe.profileImage}
            <div class="w-full md:w-1/2 lg:w-2/5">
                <img
                    src={urlFor(aboutMe.profileImage).width(600).auto('format').url()}
                    alt="Profile"
                    class="h-auto w-full shadow-md"
                />
            </div>
        {/if}

        <div class="w-full {aboutMe.profileImage ? 'md:w-1/2 lg:w-3/5' : 'mx-auto md:w-3/4'} prose">
            <PortableText value={aboutMe.mainContent} />
        </div>
    </div>

    {#if aboutMe.contactForm.formHeader || $adminMode}
        <div class="relative flex items-center justify-center gap-3">
            {#if isEditing.formHeader}
                <input
                    type="text"
                    bind:value={editedValues.formHeader}
                    class="form-header-input border-b-2 border-gray-300 bg-transparent text-center text-xl font-light focus:border-blue-500 focus:outline-none"
                    on:keydown={(e) => {
                        if (e.key === 'Enter') {
                            updateFormHeader();
                        } else if (e.key === 'Escape') {
                            cancelEditingFormHeader();
                        }
                    }}
                    on:blur={updateFormHeader}
                    placeholder="Contact form header"
                />
                <button
                    type="button"
                    on:click={updateFormHeader}
                    disabled={updateLoading.formHeader}
                    class="admin-icon checkmark-icon"
                    aria-label="Save form header"
                >
                    {#if updateLoading.formHeader}
                        <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    {:else}
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    {/if}
                </button>
            {:else}
                {#if aboutMe.contactForm.formHeader}
                    <h3 class="text-center text-xl font-light">{aboutMe.contactForm.formHeader}</h3>
                {:else if $adminMode}
                    <h3 class="text-center text-xl font-light italic text-gray-400">Add contact form header</h3>
                {/if}
                {#if $adminMode}
                    <button
                        type="button"
                        on:click={startEditingFormHeader}
                        class="admin-icon pencil-icon"
                        aria-label="Edit form header"
                    >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    </button>
                {/if}
            {/if}
        </div>
    {/if}

    <!-- Contact Form Section -->
    {#if aboutMe.contactForm}
        <form class="w-full" on:submit|preventDefault={handleSubmit}>
            {#if formSuccess}
                <div class="alert alert-success mb-6 p-4">Thank you for your message! I'll get back to you soon.</div>
            {/if}

            {#if formError}
                <div class="alert alert-error mb-6 p-4">
                    {formError}
                </div>
            {/if}

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="form-control">
                    <input
                        type="text"
                        placeholder={(aboutMe.contactForm.formFields?.namePlaceholder || 'Your name') + ' *'}
                        class="input w-full bg-transparent"
                        bind:value={formData.name}
                        required
                        autocomplete="name"
                    />
                </div>

                <div class="form-control">
                    <input
                        type="email"
                        placeholder={(aboutMe.contactForm.formFields?.emailPlaceholder || 'Your email') + ' *'}
                        class="input w-full bg-transparent"
                        bind:value={formData.email}
                        required
                        autocomplete="email"
                    />
                </div>

                <div class="form-control">
                    <input
                        type="tel"
                        placeholder={aboutMe.contactForm.formFields?.phonePlaceholder || 'Your phone number'}
                        class="input w-full bg-transparent"
                        bind:value={formData.phone}
                        autocomplete="tel"
                    />
                </div>

                <div class="form-control">
                    <input
                        type="text"
                        placeholder={aboutMe.contactForm.formFields?.referralPlaceholder ||
                            'How did you hear about me?'}
                        class="input w-full bg-transparent"
                        bind:value={formData.referral}
                        autocomplete="off"
                    />
                </div>
            </div>

            <div class="form-control col-span-2 mt-4">
                <textarea
                    placeholder={(aboutMe.contactForm.formFields?.messagePlaceholder || 'How can I help you?') + ' *'}
                    class="textarea min-h-[150px] w-full bg-transparent"
                    bind:value={formData.message}
                    required
                ></textarea>
            </div>

            <div class="form-control mt-1 flex flex-col gap-1">
                <button type="submit" class="btn btn-primary mr-0 md:mr-auto" disabled={formSubmitting}>
                    {formSubmitting ? 'Sending...' : aboutMe.contactForm.submitButtonText || 'Submit Message'}
                </button>

                <div class="text-sm">* Required fields</div>
            </div>
        </form>
    {/if}

    <div class="text-center">
        {#if aboutMe.footerTagline || $adminMode}
            <div class="relative mb-4 flex items-center justify-center gap-3">
                {#if isEditing.footerTagline}
                    <input
                        type="text"
                        bind:value={editedValues.footerTagline}
                        class="footer-tagline-input border-b-2 border-gray-300 bg-transparent text-center text-lg font-light text-gray-600 focus:border-blue-500 focus:outline-none"
                        on:keydown={(e) => {
                            if (e.key === 'Enter') {
                                updateFooterTagline();
                            } else if (e.key === 'Escape') {
                                cancelEditingFooterTagline();
                            }
                        }}
                        on:blur={updateFooterTagline}
                        placeholder="Footer tagline"
                    />
                    <button
                        type="button"
                        on:click={updateFooterTagline}
                        disabled={updateLoading.footerTagline}
                        class="admin-icon checkmark-icon"
                        aria-label="Save footer tagline"
                    >
                        {#if updateLoading.footerTagline}
                            <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        {:else}
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        {/if}
                    </button>
                {:else}
                    {#if aboutMe.footerTagline}
                        <h4 class="text-lg font-light text-gray-600">{aboutMe.footerTagline}</h4>
                    {:else if $adminMode}
                        <h4 class="text-lg font-light italic text-gray-400">Add footer tagline</h4>
                    {/if}
                    {#if $adminMode}
                        <button
                            type="button"
                            on:click={startEditingFooterTagline}
                            class="admin-icon pencil-icon"
                            aria-label="Edit footer tagline"
                        >
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    {/if}
                {/if}
            </div>
        {/if}

        {#if aboutMe.email || $adminMode}
            <div class="relative flex items-center justify-center gap-3">
                {#if isEditing.email}
                    <input
                        type="email"
                        bind:value={editedValues.email}
                        class="email-input border-b-2 border-gray-300 bg-transparent text-center focus:border-blue-500 focus:outline-none"
                        on:keydown={(e) => {
                            if (e.key === 'Enter') {
                                updateEmail();
                            } else if (e.key === 'Escape') {
                                cancelEditingEmail();
                            }
                        }}
                        on:blur={updateEmail}
                        placeholder="your.email@domain.com"
                    />
                    <button
                        type="button"
                        on:click={updateEmail}
                        disabled={updateLoading.email}
                        class="admin-icon checkmark-icon"
                        aria-label="Save email"
                    >
                        {#if updateLoading.email}
                            <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        {:else}
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        {/if}
                    </button>
                {:else}
                    {#if aboutMe.email}
                        <p class="text-center">
                            <a href="mailto:{aboutMe.email}" class="link link--zoomies">{aboutMe.email}</a>
                        </p>
                    {:else if $adminMode}
                        <p class="text-center italic text-gray-400">Add email address</p>
                    {/if}
                    {#if $adminMode}
                        <button
                            type="button"
                            on:click={startEditingEmail}
                            class="admin-icon pencil-icon"
                            aria-label="Edit email"
                        >
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    {/if}
                {/if}
            </div>
        {/if}
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

    :global(.prose h2) {
        margin-bottom: 1rem;
    }
    :global(.prose p:not(:last-of-type)) {
        margin-bottom: 1rem;
    }

    .input,
    .textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        transition: border-color 0.2s ease;

        &:focus {
            outline: none;
            border-color: vars.$secondary-color;
        }
    }

    /* Clean, simplified approach to autofill styling */
    input:-webkit-autofill,
    textarea:-webkit-autofill {
        -webkit-text-fill-color: black !important;
        box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.9) inset !important;
        -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.9) inset !important;
    }

    .btn {
        display: block;
        padding: 0.75rem 2rem;
        background-color: vars.$primary-color;
        color: white;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: color.adjust(vars.$secondary-color, $lightness: -10%);
        }
    }

    .alert {
        border-radius: 4px;

        &.alert-success {
            background-color: rgba(0, 128, 0, 0.1);
            border: 1px solid rgba(0, 128, 0, 0.3);
            color: #006400;
        }

        &.alert-error {
            background-color: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.3);
            color: #dc3545;
        }
    }

    .admin-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        position: absolute;
        top: 0;

        &:hover {
            background-color: rgba(0, 0, 0, 0.9);
            transform: scale(1.1);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        &.pencil-icon {
            right: -3rem;
        }

        &.checkmark-icon {
            right: -3rem;
            background-color: rgba(34, 197, 94, 0.8);

            &:hover {
                background-color: rgba(34, 197, 94, 1);
            }
        }
    }

    .title-input {
        min-width: 300px;
        max-width: 80vw;
    }

    .form-header-input {
        min-width: 250px;
        max-width: 70vw;
    }

    .footer-tagline-input {
        min-width: 250px;
        max-width: 70vw;
    }

    .email-input {
        min-width: 200px;
        max-width: 60vw;
    }

    @media (max-width: 768px) {
        .admin-icon {
            &.pencil-icon,
            &.checkmark-icon {
                right: -2rem;
                padding: 0.375rem;
            }
        }

        .title-input {
            font-size: 2rem;
            min-width: 250px;
        }

        .form-header-input,
        .footer-tagline-input {
            min-width: 200px;
            font-size: 1rem;
        }

        .email-input {
            min-width: 180px;
            font-size: 0.9rem;
        }
    }
</style>
