const mongoose = require('mongoose');
const Coupon = require('../server/models/Coupon');
const Product = require('../server/models/Product');
const User = require('../server/models/User');
const Order = require('../server/models/Order');
const FlashSale = require('../server/models/FlashSale');
const { verifyCoupon } = require('../server/controllers/marketingController');

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    process.exit(1);
});

// MOCK RES OBJECT
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        res.headersSent = true; // Emulate express
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runVerification = async () => {
    try {
        console.log("--> Connecting to DB...");
        // Use 127.0.0.1 and no deprecated options for newer mongoose
        await mongoose.connect('mongodb://127.0.0.1:27017/highphaus');
        console.log("✅ DB Connected");

        // 1. SETUP DATA
        console.log("--> Creating Test Product...");
        const product = await Product.create({
            name: "Test Scope",
            price: 1000,
            category: "Optics",
            countInStock: 10,
            image: "test.jpg",
            slug: `test-scope-${Date.now()}`
        });
        console.log("✅ Product Created");

        const otherProduct = await Product.create({
            name: "Test Mount",
            price: 500,
            category: "Accessories",
            countInStock: 10,
            image: "mount.jpg",
            slug: `test-mount-${Date.now()}`
        });

        console.log("--> Creating Test User...");
        const user = await User.create({
            firstName: "Test",
            lastName: "User",
            email: `test${Date.now()}@example.com`,
            password: "password123"
        });

        console.log(`✅ Setup Complete: Product ${product._id}, User ${user._id}`);

        // 2. TEST RESTRICTED COUPON (Product Specific)
        console.log("--> Creating Restricted Coupon...");
        const restrictedCoupon = await Coupon.create({
            code: `SCOPE50-${Date.now()}`,
            discountType: 'percentage',
            discountAmount: 50, // 50% OFF
            minPurchase: 100,
            expiryDate: new Date(Date.now() + 86400000), // Tomorrow
            eligibleProducts: [product._id]
        });

        console.log(`\n--- Testing Product Restriction ---`);

        // Scenario A: Valid Cart (Contains Eligible Product)
        let req = {
            body: {
                code: restrictedCoupon.code,
                cartTotal: 1500,
                userId: user._id,
                cartItems: [
                    { product: product._id, price: 1000, quantity: 1 },
                    { product: otherProduct._id, price: 500, quantity: 1 }
                ]
            }
        };
        let res = mockRes();
        console.log("--> Calling verifyCoupon (Scenario A)...");
        await verifyCoupon(req, res);
        console.log("--> Scenario A Returned:", res.statusCode);

        if (res.statusCode === 200 && res.data.discount === 500) { // 50% of 1000 (Scope only)
            console.log(`✅ Scenario A Passed: Coupon applied to eligible product only. Discount: ${res.data.discount}`);
        } else {
            console.error(`❌ Scenario A Failed: Expected 500 discount, got`, res.data);
        }

        // Scenario B: Invalid Cart (No Eligible Product)
        console.log("--> Testing Scenario B (Invalid Cart)...");
        req.body.cartItems = [{ product: otherProduct._id, price: 500, quantity: 1 }];
        req.body.cartTotal = 500;
        res = mockRes();
        await verifyCoupon(req, res);
        console.log("--> Scenario B Returned:", res.statusCode);

        if (res.statusCode === 400) {
            console.log(`✅ Scenario B Passed: Coupon rejected for ineligible cart.`);
        } else {
            console.error(`❌ Scenario B Failed: Expected 400, got`, res.statusCode, res.data);
        }


        // 3. TEST USAGE LIMITS
        console.log(`\n--- Testing Usage Limits ---`);
        const limitedCoupon = await Coupon.create({
            code: `LIMIT1-${Date.now()}`,
            discountType: 'fixed',
            discountAmount: 100,
            minPurchase: 0,
            expiryDate: new Date(Date.now() + 86400000),
            usageLimit: 1
        });

        // Set used count manually to simulate usage
        limitedCoupon.usedCount = 1;
        await limitedCoupon.save();

        req.body.code = limitedCoupon.code;
        res = mockRes();
        await verifyCoupon(req, res);

        if (res.statusCode === 400 && res.data.message.includes('Limit')) {
            console.log(`✅ Global Limit Check Passed.`);
        } else {
            console.error(`❌ Global Limit Check Failed:`, res.data);
        }

        // 4. FLASH SALE CHECK
        console.log(`\n--- Testing Flash Sale ---`);
        const flashSale = await FlashSale.create({
            name: "Flash Test",
            discountPercentage: 20,
            startTime: new Date(Date.now() - 3600000), // Started 1 hour ago
            endTime: new Date(Date.now() + 3600000),   // Ends in 1 hour
            products: [product._id],
            isActive: true
        });

        const checkFlashSale = await FlashSale.findOne({
            isActive: true,
            products: product._id,
            startTime: { $lte: new Date() },
            endTime: { $gte: new Date() }
        });

        if (checkFlashSale && checkFlashSale.discountPercentage === 20) {
            console.log(`✅ Flash Sale Active for Product. Discount: ${checkFlashSale.discountPercentage}%`);
        } else {
            console.error(`❌ Flash Sale verification failed.`);
        }

        // CLEANUP
        console.log("--> Cleaning up...");
        await Product.findByIdAndDelete(product._id);
        await Product.findByIdAndDelete(otherProduct._id);
        await User.findByIdAndDelete(user._id);
        await Coupon.findByIdAndDelete(restrictedCoupon._id);
        await Coupon.findByIdAndDelete(limitedCoupon._id);
        await FlashSale.findByIdAndDelete(flashSale._id);

        console.log("\n✅ Cleanup Complete");
        process.exit(0);

    } catch (error) {
        console.error("Verification Error Details:", error);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
};

runVerification();
