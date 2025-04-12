#!/usr/bin/env node

import bcrypt from 'bcrypt';
import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Generate a password hash with bcrypt
 */
async function generateHash(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Main script execution
 */
async function main() {
    console.log('\n===== Password Hash Generator =====');
    console.log('This utility will help you create a secure password hash for your admin account.\n');

    // Get password from user input
    rl.question('Enter the password you want to hash: ', async (password) => {
        if (!password || password.length < 8) {
            console.log('\n[ERROR] Password must be at least 8 characters long.');
            rl.close();
            return;
        }

        try {
            const hash = await generateHash(password);

            console.log('\n===== Your Password Hash =====');
            console.log(hash);
            he;
            console.log('\n===== Instructions =====');
            console.log('1. Add this hash to your .env file:');
            console.log('   ADMIN_PASSWORD_HASH="' + hash + '"');
            console.log('\n2. For password recovery, add your email:');
            console.log('   ADMIN_RECOVERY_EMAIL="your-email@example.com"');
            console.log('\n3. For email functionality, configure SMTP settings:');
            console.log('   SMTP_HOST="smtp.example.com"');
            console.log('   SMTP_PORT=587');
            console.log('   SMTP_SECURE=false');
            console.log('   SMTP_USER="user@example.com"');
            console.log('   SMTP_PASS="your-password"');
            console.log('   SMTP_FROM="no-reply@example.com"');
            console.log('   PUBLIC_SITE_URL="https://yoursite.com"');
        } catch (error) {
            console.error('\n[ERROR] Failed to generate hash:', error.message);
        }

        rl.close();
    });
}

// Run the script
main();
