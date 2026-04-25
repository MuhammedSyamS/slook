console.log("Starting Debug...");
try {
    const Coupon = require('../server/models/Coupon');
    console.log("✅ Coupon Loaded");
    const Product = require('../server/models/Product');
    console.log("✅ Product Loaded");
    const Newsletter = require('../server/models/Newsletter');
    console.log("✅ Newsletter Loaded");
    const FlashSale = require('../server/models/FlashSale');
    console.log("✅ FlashSale Loaded");
    const Order = require('../server/models/Order');
    console.log("✅ Order Loaded");
    const { verifyCoupon } = require('../server/controllers/marketingController');
    console.log("✅ Controller Loaded");
} catch (e) {
    console.error("IMPORT ERROR:", e);
}
console.log("Finished Debug");
