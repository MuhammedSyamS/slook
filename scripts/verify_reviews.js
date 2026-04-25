const mongoose = require('mongoose');
const Product = require('../server/models/Product');
const User = require('../server/models/User');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const TEST_PRODUCT_ID = "6798c760e0a5c20c0211f456"; // Replace if needed, or create new
const TEST_USER_EMAIL = "reviewer@test.com";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Create User
        await User.deleteOne({ email: TEST_USER_EMAIL });
        const user = await User.create({
            firstName: "Reviewer", lastName: "Test", email: TEST_USER_EMAIL, password: "password", isAdmin: false
        });
        const token = "mock_token"; // In real script we'd login, but here we can't easily mock auth middleware without valid token. 
        // Actually, we can bypass auth if we test Controller directly or use a real login helper.
        // Let's use the Controller directly to avoid HTTP Auth complexity for this script, 
        // OR login via API if server is running. Server is running on 5000.

        // Let's Login via API
        const loginRes = await axios.post('http://localhost:5005/api/users/login', {
            email: TEST_USER_EMAIL, password: "password"
        });
        const userToken = loginRes.data.token;
        console.log("✅ User Logged In");

        // 2. Find/Create Product
        let product = await Product.findOne();
        if (!product) {
            product = await Product.create({
                name: "Test Product", slug: "test-prod", price: 100, image: "img.jpg", countInStock: 10, category: "Test"
            });
        }
        console.log(`Using Product: ${product.name} (${product._id})`);

        // 3. Clear existing reviews
        product.reviews = [];
        await product.save();

        // 4. Submit Review with Images
        const base64Img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        console.log("Submitting Review...");

        await axios.post(`http://localhost:5005/api/products/${product._id}/reviews`, {
            rating: 5,
            comment: "Amazing visual review!",
            images: [base64Img, base64Img]
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        // 5. Verify DB
        const updatedProduct = await Product.findById(product._id);
        const review = updatedProduct.reviews[0];

        if (review.images && review.images.length === 2) {
            console.log("✅ Review Images Saved in DB");
        } else {
            console.error("❌ Review Images NOT Saved", review);
            process.exit(1);
        }

        console.log("✅ Verification Successful");
        process.exit(0);

    } catch (error) {
        if (error.response) {
            console.error("❌ Detailed Error Response:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("❌ Error Message:", error.message);
        }
        process.exit(1);
    }
};

run();
