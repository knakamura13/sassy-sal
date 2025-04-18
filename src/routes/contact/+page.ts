import { client } from '$lib/sanity';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch contact page data from Sanity
    const contact = await client.fetch(`*[_type == "contact"][0]`);

    return {
        contact
    };
}; 