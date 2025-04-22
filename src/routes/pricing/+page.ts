import { client } from '$lib/sanity';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch pricing page data from Sanity
    const pricing = await client.fetch(`*[_type == "pricing"][0]`);

    return {
        pricing
    };
}; 