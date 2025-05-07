export default {
    name: 'aboutMe',
    title: 'About Me',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            description: 'Title of the about me page (e.g., "About Me")',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'profileImage',
            title: 'Profile Image',
            description: 'Optional image to display on the about me page',
            type: 'image',
            options: {
                hotspot: true
            }
        },
        {
            name: 'mainContent',
            title: 'Main Content',
            description: 'Brief description of the about me page (e.g., "I am a photographer...")',
            type: 'array',
            of: [{ type: 'block' }],
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'email',
            title: 'Email Address',
            description: 'Email address of the about me page',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        }
    ]
};
