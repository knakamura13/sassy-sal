import { client } from '$lib/sanity';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch about page data from Sanity
    const about = await client.fetch(`*[_type == "about"][0]`);

    return {
        about
    };
}; 