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
            name: 'contactForm',
            title: 'Contact Form',
            type: 'object',
            fields: [
                {
                    name: 'formHeader',
                    title: 'Form Header',
                    description: 'Header text that spans the full width of the page (e.g., "From life\'s milestones to everyday magic, I\'m here to photograph it all — let\'s connect.")',
                    type: 'string'
                },
                {
                    name: 'formFields',
                    title: 'Form Fields',
                    type: 'object',
                    fields: [
                        {
                            name: 'namePlaceholder',
                            title: 'Name Field Placeholder',
                            type: 'string',
                            initialValue: 'Your name'
                        },
                        {
                            name: 'emailPlaceholder',
                            title: 'Email Field Placeholder',
                            type: 'string',
                            initialValue: 'Your email'
                        },
                        {
                            name: 'phonePlaceholder',
                            title: 'Phone Field Placeholder',
                            type: 'string',
                            initialValue: 'Your phone number'
                        },
                        {
                            name: 'referralPlaceholder',
                            title: 'Referral Field Placeholder',
                            type: 'string',
                            initialValue: 'How did you hear about me?'
                        },
                        {
                            name: 'messagePlaceholder',
                            title: 'Message Field Placeholder',
                            type: 'string',
                            initialValue: 'How can I help you?'
                        }
                    ]
                },
                {
                    name: 'submitButtonText',
                    title: 'Submit Button Text',
                    type: 'string',
                    initialValue: 'Submit Message'
                }
            ]
        },
        {
            name: 'footerTagline',
            title: 'Footer Tagline',
            description: 'Text displayed above the email at the bottom of the page (e.g., "Lifestyle, headshot, engagement, and event photography.")',
            type: 'string'
        },
        {
            name: 'email',
            title: 'Email Address',
            description: 'Email address of the about me page',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        },
    ]
};
