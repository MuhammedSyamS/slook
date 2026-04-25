const sendEmail = require('../server/utils/sendEmail');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const run = async () => {
    try {
        console.log("Testing Email Connection...");
        await sendEmail({
            email: 'test_recipient@example.com',
            subject: 'Test Email from SLOOK Script',
            html: '<h1>It Works!</h1><p>This is a test email.</p>',
            text: 'This is a test email.'
        });
        console.log("✅ Email Test Passed");
    } catch (error) {
        console.error("❌ Email Test Failed:", error);
    }
};

run();
