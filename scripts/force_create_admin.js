const mongoose = require('mongoose');
const User = require('../server/models/User'); // Adjust path if needed
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' }); // Adjust if .env is elsewhere

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        const email = 'superadmin@example.com';
        const password = 'password123';

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log("User exists. Updating to Admin...");
            user.isAdmin = true;
            user.role = 'admin';
            user.permissions = [];
            // Passwords are hashed, so if we want to reset it we need to just set it and let pre-save hook handle it?
            // Or just assume it's known.
            // Let's force reset password to be sure.
            user.password = password;
        } else {
            console.log("Creating new Super Admin...");
            user = new User({
                firstName: 'Super',
                lastName: 'Admin',
                email,
                password,
                isAdmin: true,
                role: 'admin'
            });
        }

        await user.save();
        console.log(`Admin Ready: ${email} / ${password}`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createAdmin();
