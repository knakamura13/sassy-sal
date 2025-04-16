/** @type {import('./$types').PageLoad} */
export function load({ data, prerendering }) {
    // Get admin status from server data
    return {
        ...data // Keep all server-loaded data (including categories and admin status)
    };
}
