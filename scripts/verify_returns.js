const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const TEST_EMAIL = 'test_return_user@example.com';
const ADMIN_EMAIL = 'admin_return_user@example.com';
const BASE_URL = 'http://localhost:5005/api';

const Order = require('../server/models/Order');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const Return = require('../server/models/Return');

async function run() {
    try {
        // 1. CONNECT DB
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/highphause';
        await mongoose.connect(mongoUri);
        console.log('✅ DB Connected');

        // 2. SETUP DATA
        // User
        await User.deleteOne({ email: TEST_EMAIL }); // Reset
        const user = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: TEST_EMAIL,
            password: 'password123',
            shippingAddress: { address: 'Test St', city: 'Test City', postalCode: '12345', phone: '123' }
        });
        console.log('✅ User Created');

        let userToken;
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, { email: TEST_EMAIL, password: 'password123' });
            userToken = res.data.token;
            console.log('✅ User Logged In');
        } catch (e) {
            console.error('❌ User Login Failed:', e.response?.data || e.message);
            if (e.response) console.log("Response Status:", e.response.status);
            process.exit(1);
        }

        // Admin
        await User.deleteOne({ email: ADMIN_EMAIL });
        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: ADMIN_EMAIL,
            password: 'password123',
            isAdmin: true
        });
        console.log('✅ Admin Created');

        let adminToken;
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, { email: ADMIN_EMAIL, password: 'password123' });
            adminToken = res.data.token;
            console.log('✅ Admin Logged In');
        } catch (e) {
            console.error('❌ Admin Login Failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // Product
        let product = await Product.findOne({});
        if (!product) {
            product = await Product.create({ name: 'Test Product', price: 100, countInStock: 10, image: 'img.jpg', category: 'Test' });
        }

        // Clean previous runs
        await Order.deleteMany({ user: user._id });
        await Return.deleteMany({ user: user._id });

        // Create Delivered Order
        const order = await Order.create({
            user: user._id,
            orderItems: [{
                name: product.name,
                qty: 1,
                image: product.image,
                price: product.price,
                product: product._id,
                status: 'Delivered' // Pre-set to Delivered to allow return
            }],
            shippingAddress: { address: 'Test St', city: 'Test City', postalCode: '12345', phone: '123' },
            paymentMethod: 'Cod',
            totalPrice: product.price,
            isPaid: true, // Paid
            orderStatus: 'Delivered',
            isDelivered: true,
            deliveredAt: Date.now()
        });
        console.log('✅ Delivered Order Created:', order._id);

        const itemId = order.orderItems[0]._id;

        // 3. USER: REQUEST RETURN
        console.log('\n--- STEP 1: REQUEST RETURN ---');
        try {
            const res = await axios.post(`${BASE_URL}/returns`, {
                orderId: order._id,
                itemId: itemId,
                type: 'Return',
                reason: 'Defective',
                comment: 'Test Comment',
                images: ['test_image.jpg', 'test_video.mp4'] // Added video proof
            }, { headers: { Authorization: `Bearer ${userToken}` } });

            console.log('✅ Return Requested. ID:', res.data._id);
            var returnId = res.data._id;
        } catch (e) {
            console.error('❌ Request Failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // Verify Order Status
        let updatedOrder = await Order.findById(order._id);
        if (updatedOrder.orderItems[0].status === 'Return Requested') console.log('✅ Order Item Status Synced: Return Requested');
        else console.error('❌ Order Item Status Mismatch:', updatedOrder.orderItems[0].status);


        // 4. ADMIN: APPROVE
        console.log('\n--- STEP 2: ADMIN APPROVE ---');
        await axios.put(`${BASE_URL}/returns/${returnId}/status`, {
            status: 'Approved',
            adminComment: 'Approved via Script'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Return Approved');


        // 5. ADMIN: PICKUP & QC
        console.log('\n--- STEP 3: LOGISTICS (Pickup -> QC Passed) ---');
        // Pickup
        await axios.put(`${BASE_URL}/returns/${returnId}/status`, {
            status: 'Picked Up',
            pickupDetails: { pickedUpAt: Date.now() }
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // QC Pass
        await axios.put(`${BASE_URL}/returns/${returnId}/status`, {
            status: 'QC Passed',
            qcDetails: { status: 'Passed', adminComment: 'Looks good' }
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ QC Passed');


        // 6. ADMIN: RESOLVE (REFUND)
        console.log('\n--- STEP 4: RESOLVE (REFUND) ---');
        const resolveRes = await axios.put(`${BASE_URL}/returns/${returnId}/resolve`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Return Resolved (Refund Completed)');

        // 7. FINAL VERIFICATION
        console.log('\n--- FINAL VERIFICATION ---');
        updatedOrder = await Order.findById(order._id);
        const updatedReturn = await Return.findById(returnId);

        console.log('Return Status:', updatedReturn.status); // Should be 'Refund Completed'
        console.log('Order Item Status:', updatedOrder.orderItems[0].status); // Should be 'Returned'
        console.log('Resolution Date:', updatedReturn.resolutionDetails?.resolvedAt);

        if (updatedReturn.status === 'Refund Completed' && updatedOrder.orderItems[0].status === 'Returned') {
            console.log('\n🎉 SUCCESS: Full Return Lifecycle Verified!');
        } else {
            console.error('\n❌ FAILURE: Status mismatch at end of flow.');
        }

    } catch (error) {
        console.error('CRASH:', error.message, error.response?.data);
    } finally {
        await mongoose.disconnect();
    }
}

run();
