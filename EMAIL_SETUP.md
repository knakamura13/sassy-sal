# Email Configuration Setup

To enable the contact form email functionality, you need to set up email credentials:

## Gmail Setup

If using Gmail:

1. Create an App Password for your Gmail account:

    - Go to your Google Account settings
    - Navigate to Security > 2-Step Verification > App passwords
    - Create a new app password for "Mail" on "Other (Custom name)"
    - Copy the generated 16-character password

2. Create a `.env` file in the project root with the following content:

    ```
    # Email configuration
    VITE_EMAIL_USER=sallyjkphoto@gmail.com
    VITE_EMAIL_PASSWORD=your_app_password_here
    ```

3. Replace `your_app_password_here` with the App Password generated in step 1.

## Security Notes

- Never commit the `.env` file to version control
- The `.env` file should be added to your `.gitignore` file
- For production deployment, set these environment variables in your hosting provider's dashboard
