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

const verifyTargetedSale = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // 1. Get a product to target
        const targetProduct = await Product.findOne();
        if (!targetProduct) {
            console.log('❌ No products found to test.');
            process.exit(1);
        }
        console.log(`Targeting Product: ${targetProduct.name} (${targetProduct._id})`);

        // 2. Create Targeted Flash Sale
        console.log('1. Creating Targeted Flash Sale...');
        const startTime = new Date();
        const endTime = new Date(Date.now() + 3600000); // 1 hour from now

        const saleReq = mockReq({
            name: 'Targeted Test Sale',
            discountPercentage: 30,
            startTime,
            endTime,
            products: [targetProduct._id.toString()] // TARGETED
        });
        const saleRes = mockRes();

        await createFlashSale(saleReq, saleRes);

        if (saleRes.statusCode === 201) {
            console.log('✅ Targeted Flash Sale Created:', saleRes.data.name);
        } else {
            console.error('❌ Failed to create Targeted Sale:', saleRes.data);
            process.exit(1);
        }

        // 3. Check applicability to the TARGETED product
        console.log('2. Checking applicability to TARGETED product...');
        const checkReq1 = mockReq({}, { productId: targetProduct._id.toString() });
        const checkRes1 = mockRes();

        await checkProductFlashSale(checkReq1, checkRes1);

        if (checkRes1.data && checkRes1.data.active && checkRes1.data.discountPercentage === 30) {
            console.log(`✅ Targeted Sale successfully applied to target product.`);
        } else {
            console.error('❌ Targeted Sale did NOT apply to target product:', checkRes1.data);
        }

        // 4. Check applicability to a NON-TARGETED product
        console.log('3. Checking applicability to NON-TARGETED product...');
        const otherProduct = await Product.findOne({ _id: { $ne: targetProduct._id } });
        if (otherProduct) {
            const checkReq2 = mockReq({}, { productId: otherProduct._id.toString() });
            const checkRes2 = mockRes();

            await checkProductFlashSale(checkReq2, checkRes2);

            if (checkRes2.data && !checkRes2.data.active) {
                console.log(`✅ Targeted Sale correctly ignored non-target product.`);
            } else {
                console.error('❌ Targeted Sale INCORRECTLY applied to non-target product:', checkRes2.data);
            }
        } else {
            console.log('⚠️ Could not find a second product to test exclusion.');
        }

        // Cleanup
        await FlashSale.deleteMany({ name: 'Targeted Test Sale' });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyTargetedSale();
