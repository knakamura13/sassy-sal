<script>
    export let data;
    const { aboutMe } = data;

    import { PortableText } from '@portabletext/svelte';
    import { urlFor } from '$lib/utils/image';

    // Form state
    let formSubmitting = false;
    let formSuccess = false;
    let formError = null;

    // Form data
    let formData = {
        name: '',
        email: '',
        phone: '',
        referral: '',
        message: ''
    };

    // Handle form submission
    async function handleSubmit() {
        formSubmitting = true;
        formSuccess = false;
        formError = null;

        try {
            const response = await fetch('/api/contact', {
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

<div class="container mx-auto max-w-[1400px] px-4 py-16">
    <h1 class="font-didot mb-12 text-center text-4xl">{aboutMe.title}</h1>

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

    <!-- Contact Form Section -->
    {#if aboutMe.contactForm}
        <div class="mt-20">
            {#if aboutMe.contactForm.formHeader}
                <h3 class="mb-8 text-center text-2xl font-light">{aboutMe.contactForm.formHeader}</h3>
            {/if}

            <form class="mx-auto max-w-2xl" on:submit|preventDefault={handleSubmit}>
                {#if formSuccess}
                    <div class="alert alert-success mb-6 p-4">
                        Thank you for your message! I'll get back to you soon.
                    </div>
                {/if}

                {#if formError}
                    <div class="alert alert-error mb-6 p-4">
                        {formError}
                    </div>
                {/if}

                <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="form-control">
                        <input
                            type="text"
                            placeholder={aboutMe.contactForm.formFields?.namePlaceholder || 'Your name'}
                            class="input w-full bg-transparent"
                            bind:value={formData.name}
                            required
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="email"
                            placeholder={aboutMe.contactForm.formFields?.emailPlaceholder || 'Your email'}
                            class="input w-full bg-transparent"
                            bind:value={formData.email}
                            required
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="tel"
                            placeholder={aboutMe.contactForm.formFields?.phonePlaceholder || 'Your phone number'}
                            class="input w-full bg-transparent"
                            bind:value={formData.phone}
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="text"
                            placeholder={aboutMe.contactForm.formFields?.referralPlaceholder ||
                                'How did you hear about me?'}
                            class="input w-full bg-transparent"
                            bind:value={formData.referral}
                        />
                    </div>
                </div>

                <div class="form-control mb-2">
                    <textarea
                        placeholder={aboutMe.contactForm.formFields?.messagePlaceholder || 'How can I help you?'}
                        class="textarea min-h-[150px] w-full bg-transparent"
                        bind:value={formData.message}
                        required
                    ></textarea>
                </div>

                <div class="form-control">
                    <button type="submit" class="btn btn-primary" disabled={formSubmitting}>
                        {formSubmitting ? 'Sending...' : aboutMe.contactForm.submitButtonText || 'Submit Message'}
                    </button>
                </div>
            </form>
        </div>
    {/if}

    <div class="mt-16 text-center">
        {#if aboutMe.footerTagline}
            <h4 class="mb-4 text-lg font-light text-gray-600">{aboutMe.footerTagline}</h4>
        {/if}

        {#if aboutMe.email}
            <p class="text-center">
                <a href="mailto:{aboutMe.email}" class="link link--zoomies">{aboutMe.email}</a>
            </p>
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

    :global(.prose p) {
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
        background-color: vars.$secondary-color;
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
</style>
