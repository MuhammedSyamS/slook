const mongoose = require('mongoose');
const User = require('../server/models/User');
const Order = require('../server/models/Order');
const sendEmail = require('../server/utils/sendEmail');
const { getWelcomeTemplate, getShippingConfirmationTemplate } = require('../server/utils/emailTemplates');

require('dotenv').config({ path: './server/.env' });

const verifyEmails = async () => {
    try {
        console.log("1. Testing Welcome Email Template...");
        const mockUser = { firstName: "TestUser", email: "test@example.com" };
        const welcomeHtml = getWelcomeTemplate(mockUser);
        if (welcomeHtml.includes("Welcome to SLOOK")) {
            console.log("✅ Welcome Template Generated Successfully.");
        } else {
            console.error("❌ Welcome Template Failed.");
        }

        console.log("2. Testing Shipping Email Template...");
        const mockOrder = {
            _id: "ORDER12345",
            trackingId: "TRACK888",
            deliveryPartner: "BlueDart"
        };
        const shippingHtml = getShippingConfirmationTemplate(mockOrder);
        if (shippingHtml.includes("Your Order Has Shipped")) {
            console.log("✅ Shipping Template Generated Successfully.");
        } else {
            console.error("❌ Shipping Template Failed.");
        }

        console.log("3. Sending Real Test Email (Welcome)...");
        // We use the email from .env or a fallback, testing the sendEmail utility
        const recipient = process.env.EMAIL_USER;
        if (recipient && recipient !== 'verify.slook@gmail.com') { // Safety check to not spam default if changed
            await sendEmail({
                email: recipient,
                subject: "TEST: Welcome Email Verification",
                html: welcomeHtml
            });
            console.log(`✅ Email sent to ${recipient}`);
        } else {
            console.log("⚠️ Skipping actual send (Using default/test email config).");
            // Just dry run the function with a dummy to check for crashes
            try {
                // Testing connection only
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    },
                    tls: { rejectUnauthorized: false }
                });
                await transporter.verify();
                console.log("✅ SMTP Connection Verified.");
            } catch (e) {
                console.error("❌ SMTP Connection Failed:", e.message);
            }
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
    process.exit(0);
};

verifyEmails();
