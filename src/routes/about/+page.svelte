<div class="container mx-auto max-w-4xl px-4 py-16">
    <h1 class="font-didot mb-8 text-center text-4xl">About Me</h1>

    <div class="mb-16 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div>
            <div class="aspect-square overflow-hidden rounded-lg bg-gray-200">
                <!-- Placeholder for photographer image -->
                <div class="flex h-full w-full items-center justify-center text-gray-500">Photographer Image</div>
            </div>
        </div>

        <div>
            <h2 class="font-didot mb-4 text-2xl">Hello, I'm Sally</h2>

            <p class="mb-4">
                Welcome to my photography portfolio! I'm a professional photographer based in [Your City], specializing
                in lifestyle, portrait, and event photography.
            </p>

            <p class="mb-4">
                My journey with photography began over 10 years ago when I picked up my first DSLR camera. Since then,
                I've had the privilege of capturing countless special moments for families, couples, and individuals.
            </p>

            <p class="mb-4">
                My style is a blend of candid documentary and artistic portraiture. I believe in creating images that
                feel authentic while bringing out the best in my subjects.
            </p>
        </div>
    </div>

    <div class="mb-16 rounded-lg bg-gray-50 p-8">
        <h2 class="font-didot mb-6 text-center text-2xl">My Approach</h2>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div class="text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    <svg
                        class="h-8 w-8 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        ></path>
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                    </svg>
                </div>
                <h3 class="mb-2 font-semibold">Authentic Moments</h3>
                <p class="text-gray-600">
                    I focus on capturing genuine emotions and interactions rather than forced poses.
                </p>
            </div>

            <div class="text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    <svg
                        class="h-8 w-8 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        ></path>
                    </svg>
                </div>
                <h3 class="mb-2 font-semibold">Artistic Vision</h3>
                <p class="text-gray-600">
                    Every shoot is crafted with attention to composition, light, and creative perspective.
                </p>
            </div>

            <div class="text-center">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    <svg
                        class="h-8 w-8 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        ></path>
                    </svg>
                </div>
                <h3 class="mb-2 font-semibold">Personal Connection</h3>
                <p class="text-gray-600">
                    I believe in building relationships with clients to create comfortable and meaningful sessions.
                </p>
            </div>
        </div>
    </div>

    <div class="text-center">
        <h2 class="font-didot mb-6 text-2xl">Ready to work together?</h2>
        <a
            href="/contact"
            class="inline-block rounded-full bg-gray-800 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
        >
            Get in touch
        </a>
    </div>
</div>

<style lang="scss">
    @use '../../lib/styles/variables' as vars;
    @use 'sass:color';

    h1,
    h2,
    h3 {
        color: vars.$primary-color;
    }

    a {
        &:hover {
            background-color: vars.$secondary-color;
        }
    }
</style>
