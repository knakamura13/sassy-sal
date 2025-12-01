import type { PageLoad } from './$types';

// Server load now fetches data; client load just hands it through
export const load: PageLoad = ({ data }) => data;
