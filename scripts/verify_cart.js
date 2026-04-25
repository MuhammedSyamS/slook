const mongoose = require('mongoose');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const TEST_USER_EMAIL = "cart_tester@test.com";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Create/Login User
        await User.deleteOne({ email: TEST_USER_EMAIL });
        await User.create({
            firstName: "Cart", lastName: "Tester", email: TEST_USER_EMAIL, password: "password", isAdmin: false
        });

        const loginRes = await axios.post('http://localhost:5005/api/users/login', {
            email: TEST_USER_EMAIL, password: "password"
        });
        const token = loginRes.data.token;
        console.log("✅ User Logged In");

        // 2. Find a Product
        const product = await Product.findOne();
        if (!product) {
            console.error("❌ No products found to test with");
            process.exit(1);
        }
        console.log(`Using Product: ${product.name}`);

        // 3. Add to Cart
        console.log("Adding to Cart...");
        const addRes = await axios.post('http://localhost:5005/api/cart/add', {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (addRes.data.length === 1) {
            console.log("✅ Item added to cart");
        } else {
            console.error("❌ Failed to add to cart", addRes.data);
            process.exit(1);
        }

        const cartItemId = addRes.data[0]._id;

        // 4. Save for Later
        console.log("Saving for Later...");
        const saveRes = await axios.post('http://localhost:5005/api/cart/save', {
            _id: cartItemId
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (saveRes.data.cart.length === 0 && saveRes.data.savedForLater.length === 1) {
            console.log("✅ Item moved to Saved for Later");
        } else {
            console.error("❌ Failed to save for later", saveRes.data);
            process.exit(1);
        }

        const savedItemId = saveRes.data.savedForLater[0]._id;

        // 5. Move to Cart
        console.log("Moving back to Cart...");
        const moveRes = await axios.post('http://localhost:5005/api/cart/move-to-cart', {
            _id: savedItemId
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (moveRes.data.cart.length === 1 && moveRes.data.savedForLater.length === 0) {
            console.log("✅ Item moved back to cart");
        } else {
            console.error("❌ Failed to move to cart", moveRes.data);
            process.exit(1);
        }

        console.log("✅ Cart Enhancements Verified Successfully");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

run();
