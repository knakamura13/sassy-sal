import { publicClient } from '$lib/sanityClient';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Fetch about me page data from Sanity
    const aboutMe = await publicClient.fetch(`*[_type == "aboutMe"][0]`);

    return {
        aboutMe
    };
};
