import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
    // Trust server-derived data (includes admin flag from cookie)
    return {
        ...data
    };
};
