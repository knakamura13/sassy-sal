<script>
    // Pricing packages data
    const packages = [
        {
            name: 'Basic',
            price: '$300',
            duration: '1 hour',
            photos: '20 edited digital photos',
            features: ['One location', 'Quick turnaround (7 days)', 'Personal use license']
        },
        {
            name: 'Standard',
            price: '$500',
            duration: '2 hours',
            photos: '40 edited digital photos',
            features: ['Two locations', 'Quick turnaround (7 days)', 'Personal use license', '10 professional prints']
        },
        {
            name: 'Premium',
            price: '$800',
            duration: '3 hours',
            photos: 'All edited digital photos',
            features: [
                'Multiple locations',
                'Quick turnaround (5 days)',
                'Commercial use license',
                '20 professional prints',
                'Online gallery'
            ]
        }
    ];
</script>

<div class="container mx-auto max-w-6xl px-4 py-16">
    <h1 class="font-didot mb-3 text-center text-4xl">Pricing</h1>
    <p class="mx-auto mb-12 max-w-2xl text-center text-gray-600">
        Invest in memories that will last a lifetime. All packages can be customized to meet your specific needs.
    </p>

    <div class="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {#each packages as pkg}
            <div class="rounded-lg border border-gray-100 bg-white p-8 shadow-md transition-shadow hover:shadow-lg">
                <h2 class="font-didot mb-4 text-2xl">{pkg.name}</h2>
                <p class="mb-2 text-3xl font-bold">{pkg.price}</p>
                <p class="mb-6 border-b border-gray-100 pb-6 text-gray-600">
                    {pkg.duration} • {pkg.photos}
                </p>
                <ul class="space-y-2">
                    {#each pkg.features as feature}
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

    <div class="mx-auto max-w-3xl rounded-lg bg-gray-50 p-8">
        <h2 class="font-didot mb-4 text-center text-2xl">Custom Packages</h2>
        <p class="mb-6 text-center">
            Need something different? I offer custom photography packages tailored to your specific needs.
        </p>
        <div class="text-center">
            <a
                href="/contact"
                class="inline-block rounded-full bg-gray-800 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
            >
                Contact me for details
            </a>
        </div>
    </div>
</div>

<style lang="scss">
    @use '$lib/styles/variables' as vars;
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
