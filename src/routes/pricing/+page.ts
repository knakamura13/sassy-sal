import { publicClient } from '$lib/sanityClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch pricing page data from Sanity
    const pricing = await publicClient.fetch(`*[_type == "pricing"][0]`);

    return {
        pricing
    };
}; 