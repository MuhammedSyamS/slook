const mongoose = require('mongoose');
const User = require('../server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const createCustomer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        const email = 'customer@example.com';
        const password = 'password123';

        let user = await User.findOne({ email });

        if (user) {
            console.log("Customer exists. Resetting to default customer role...");
            user.role = 'customer';
            user.isAdmin = false;
            user.permissions = [];
        } else {
            console.log("Creating new Customer...");
            user = new User({
                firstName: 'Test',
                lastName: 'Customer',
                email,
                password,
                role: 'customer',
                isAdmin: false
            });
        }

        await user.save();
        console.log(`Customer Ready: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createCustomer();
