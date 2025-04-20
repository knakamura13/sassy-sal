<script>
    export let data;
    const { pricing } = data;
</script>

<div class="container mx-auto max-w-6xl px-4 py-16">
    <h1 class="font-didot mb-3 text-center text-4xl">{pricing.title}</h1>
    <p class="mx-auto mb-12 max-w-lg text-center leading-tight text-gray-600">
        {pricing.introText}
    </p>

    <div class="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {#each pricing.pricingTiers as tier}
            <div class="rounded-lg border border-gray-100 bg-white p-8 shadow-md transition-shadow hover:shadow-lg">
                <h2 class="font-didot mb-4 text-2xl">{tier.name}</h2>
                <p class="mb-2 text-3xl font-bold">{tier.price}</p>
                <p class="mb-6 border-b border-gray-100 pb-6 text-gray-600">
                    {tier.sessionDetails}
                </p>
                <ul class="space-y-2">
                    {#each tier.features as feature}
                        <li class="flex items-start">
                            <svg
                                class="mr-2 mt-0.5 h-5 w-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
                                ></path>
                            </svg>
                            {feature}
                        </li>
                    {/each}
                </ul>
            </div>
        {/each}
    </div>

    <div class="mx-auto rounded-lg bg-gray-50 p-8">
        <h2 class="font-didot mb-4 text-center text-2xl">{pricing.customPackagesSection.sectionTitle}</h2>
        <p class="mb-6 text-center">
            {pricing.customPackagesSection.description}
        </p>
        <div class="text-center">
            <a
                href={pricing.customPackagesSection.contactButtonUrl}
                class="inline-block rounded-full bg-gray-800 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
            >
                {pricing.customPackagesSection.contactButtonText}
            </a>
        </div>
    </div>
</div>

<style lang="scss">
    @use '../../lib/styles/variables' as vars;
    @use 'sass:color';

    h1,
    h2 {
        color: vars.$primary-color;
    }

    a {
        &:hover {
            background-color: vars.$secondary-color;
        }
    }
</style>
