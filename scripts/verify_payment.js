const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const User = require('../server/models/User');
const Order = require('../server/models/Order');

const TEST_EMAIL = "payer@test.com";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Setup User
        await User.deleteOne({ email: TEST_EMAIL });
        const user = await User.create({ firstName: "Payer", lastName: "Test", email: TEST_EMAIL, password: "password", isAdmin: false });

        // Login for Token
        const loginRes = await axios.post('http://localhost:5005/api/users/login', { email: TEST_EMAIL, password: "password" });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log("✅ User Logged In");

        // 2. Create Razorpay Order (Backend)
        console.log("Creating Payment Order...");
        const payOrderRes = await axios.post('http://localhost:5005/api/payments/create-order', { amount: 500 }, config);
        const payOrder = payOrderRes.data;

        if (payOrder.id && payOrder.amount === 50000) { // 500 * 100
            console.log("✅ Razorpay Order Created:", payOrder.id);
        } else {
            throw new Error("Invalid Razorpay Order Response");
        }

        // 3. Create Local Order (Simulating Checkout)
        const order = await Order.create({
            user: user._id,
            orderItems: [{ name: "Test Item", qty: 1, price: 500, image: "img.jpg", product: new mongoose.Types.ObjectId() }],
            shippingAddress: { address: "Test St", city: "Test City", postalCode: "123456", phone: "1234567890" },
            paymentMethod: "razorpay",
            totalPrice: 500,
            isPaid: false
        });
        console.log("✅ Local Order Created (Pending):", order._id);

        // 4. Mimic Payment Success & Verify
        // We need to generate a valid signature for the verification endpoint to accept it.
        // Signature = HMAC_SHA256(order_id + "|" + payment_id, secret)

        const fakePaymentId = "pay_fake123456";
        const body = payOrder.id + "|" + fakePaymentId;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

        const signature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

        console.log("Verifying Payment...");
        const verifyRes = await axios.post('http://localhost:5005/api/payments/verify', {
            razorpay_order_id: payOrder.id,
            razorpay_payment_id: fakePaymentId,
            razorpay_signature: signature,
            orderId: order._id
        }, config);

        // 5. Check DB
        const updatedOrder = await Order.findById(order._id);
        if (updatedOrder.isPaid) {
            console.log("✅ Order Marked as Paid in DB");
        } else {
            throw new Error("Order NOT marked as paid");
        }

        console.log("✅ Payment Flow Verification Successful");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error Stack:", error.stack);
        if (error.response) {
            console.error("❌ Response Status:", error.response.status);
            console.error("❌ Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("❌ Error Message:", error.message);
        }
        process.exit(1);
    }
};

run();
