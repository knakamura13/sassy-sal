import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const adminSession = cookies.get('admin_session');
    const admin = adminSession === 'authenticated';
    return { admin };
};
