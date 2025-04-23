import { publicClient } from '$lib/sanityClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch contact page data from Sanity
    const contact = await publicClient.fetch(`*[_type == "contact"][0]`);

    return {
        contact
    };
}; 