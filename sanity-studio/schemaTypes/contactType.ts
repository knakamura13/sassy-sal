export default {
    name: 'contact',
    title: 'Contact Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            description: 'Title of the contact page (e.g., "Contact")',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'mainContent',
            title: 'Main Content',
            description: 'Brief description of services (e.g., "Lifestyle, headshot, engagement, and event photography.")',
            type: 'text',
            validation: (Rule: any) => Rule.required()
        },
        {
            name: 'email',
            title: 'Email Address',
            description: 'Contact email address',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        }
    ]
};
