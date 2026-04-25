const mongoose = require('mongoose');
const FlashSale = require('../server/models/FlashSale');
const Product = require('../server/models/Product');
const { checkProductFlashSale, createFlashSale } = require('../server/controllers/marketingController');

// Mock Request/Response
const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

require('dotenv').config({ path: './server/.env' });

const verifyGlobalSale = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Create Global Flash Sale (No Products)
        console.log('1. Creating Global Flash Sale...');
        const startTime = new Date();
        const endTime = new Date(Date.now() + 3600000); // 1 hour from now

        const saleReq = mockReq({
            name: 'Global Test Sale',
            discountPercentage: 50,
            startTime,
            endTime,
            products: [] // EMPTY = GLOBAL
        });
        const saleRes = mockRes();

        await createFlashSale(saleReq, saleRes);

        if (saleRes.statusCode === 201) {
            console.log('✅ Global Flash Sale Created:', saleRes.data.name);
        } else {
            console.error('❌ Failed to create Global Sale:', saleRes.data);
            process.exit(1);
        }

        // 2. Check if it applies to a random product
        console.log('2. Checking applicability to random product...');
        const product = await Product.findOne();
        if (!product) {
            console.log('❌ No products found to test.');
            process.exit(1);
        }

        const checkReq = mockReq({}, { productId: product._id });
        const checkRes = mockRes();

        await checkProductFlashSale(checkReq, checkRes);

        if (checkRes.data && checkRes.data.active && checkRes.data.discountPercentage === 50) {
            console.log(`✅ Global Sale successfully applied to product: ${product.name}`);
        } else {
            console.error('❌ Global Sale did NOT apply to product:', checkRes.data);
        }

        // Cleanup
        await FlashSale.deleteMany({ name: 'Global Test Sale' });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyGlobalSale();
