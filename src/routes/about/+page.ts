import { publicClient } from '$lib/sanityClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch about page data from Sanity
    const about = await publicClient.fetch(`*[_type == "about"][0]`);

    return {
        about
    };
}; 