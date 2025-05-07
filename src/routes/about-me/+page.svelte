<script>
    export let data;
    const { aboutMe } = data;

    import { PortableText } from '@portabletext/svelte';
    import { urlFor } from '$lib/utils/image';
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
                    class="h-auto w-full rounded-lg shadow-md"
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

            <form class="mx-auto max-w-2xl">
                <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div class="form-control">
                        <input
                            type="text"
                            placeholder={aboutMe.contactForm.formFields?.namePlaceholder || 'Your name'}
                            class="input w-full"
                            required
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="email"
                            placeholder={aboutMe.contactForm.formFields?.emailPlaceholder || 'Your email'}
                            class="input w-full"
                            required
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="tel"
                            placeholder={aboutMe.contactForm.formFields?.phonePlaceholder || 'Your phone number'}
                            class="input w-full"
                        />
                    </div>

                    <div class="form-control">
                        <input
                            type="text"
                            placeholder={aboutMe.contactForm.formFields?.referralPlaceholder ||
                                'How did you hear about me?'}
                            class="input w-full"
                        />
                    </div>
                </div>

                <div class="form-control mb-6">
                    <textarea
                        placeholder={aboutMe.contactForm.formFields?.messagePlaceholder || 'How can I help you?'}
                        class="textarea min-h-[150px] w-full"
                        required
                    ></textarea>
                </div>

                <div class="form-control">
                    <button type="submit" class="btn btn-primary mx-auto">
                        {aboutMe.contactForm.submitButtonText || 'Submit Message'}
                    </button>
                </div>
            </form>
        </div>
    {/if}

    {#if aboutMe.email}
        <p class="mt-6 text-center">
            <a href="mailto:{aboutMe.email}" class="link link--zoomies">{aboutMe.email}</a>
        </p>
    {/if}
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
        border-radius: 0.25rem;
        transition: border-color 0.2s ease;

        &:focus {
            outline: none;
            border-color: vars.$secondary-color;
        }
    }

    .btn {
        display: block;
        padding: 0.75rem 2rem;
        background-color: vars.$secondary-color;
        color: white;
        border: none;
        border-radius: 0.25rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: color.adjust(vars.$secondary-color, $lightness: -10%);
        }
    }
</style>
