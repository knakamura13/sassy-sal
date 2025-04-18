export default {
    name: 'contact',
    title: 'Contact Page',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'introText',
            title: 'Introduction Text',
            type: 'text',
            validation: (Rule) => Rule.required()
        },
        {
            name: 'email',
            title: 'Email Address',
            type: 'string'
        },
        {
            name: 'phone',
            title: 'Phone Number',
            type: 'string'
        },
        {
            name: 'address',
            title: 'Address',
            type: 'text'
        },
        {
            name: 'businessHours',
            title: 'Business Hours',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'day',
                            title: 'Day',
                            type: 'string'
                        },
                        {
                            name: 'hours',
                            title: 'Hours',
                            type: 'string'
                        }
                    ]
                }
            ]
        },
        {
            name: 'socialLinks',
            title: 'Social Media Links',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'platform',
                            title: 'Platform',
                            type: 'string'
                        },
                        {
                            name: 'url',
                            title: 'URL',
                            type: 'url'
                        }
                    ]
                }
            ]
        },
        {
            name: 'contactFormInfo',
            title: 'Contact Form Information',
            type: 'text'
        }
    ]
};
