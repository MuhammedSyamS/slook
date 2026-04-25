const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs'); // NEW

// Load env from server folder
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const BASE_URL = 'http://localhost:5005/api';

async function verifyAnalytics() {
    console.log('--- PHASE 10: ANALYTICS VERIFICATION ---');

    try {
        // 0. Ensure Admin User Exists
        const User = require('../server/models/User');
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);

        await User.deleteOne({ email: 'admin_test@example.com' });
        await User.create({
            firstName: 'Admin',
            lastName: 'Test',
            email: 'admin_test@example.com',
            password: 'password123',
            isAdmin: true
        });
        console.log('✅ Admin User Created (via User.create)');

        // 1. Get Admin Token
        const loginRes = await axios.post(`${BASE_URL}/users/login`, {
            email: 'admin_test@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Admin Authenticated');

        // 2. Fetch Stats
        const statsRes = await axios.get(`${BASE_URL}/orders/admin/stats?timeRange=monthly`, config);
        const stats = statsRes.data;
        console.log('✅ Stats Fetched Successfully');

        // 3. Verify New Metrics
        let errors = [];

        // Subcategory Sales
        if (!Array.isArray(stats.subcategorySales)) {
            errors.push('subcategorySales is missing or not an array');
        } else {
            console.log(`✅ Subcategory Sales Found: ${stats.subcategorySales.length} items`);
            stats.subcategorySales.slice(0, 3).forEach(s => console.log(`   - ${s.name}: ₹${s.value}`));
        }

        // Profit Margins in ChartData
        if (!Array.isArray(stats.chartData) || stats.chartData.length === 0) {
            errors.push('chartData is empty');
        } else {
            const hasMargin = stats.chartData.some(d => d.profitMargin !== undefined);
            if (!hasMargin) errors.push('profitMargin missing from chartData');
            else console.log('✅ Profit Margins present in time-series data');
        }

        // Top Customers (Enhanced)
        if (!Array.isArray(stats.topCustomers) || stats.topCustomers.length === 0) {
            errors.push('topCustomers is empty');
        } else {
            const customer = stats.topCustomers[0];
            if (customer.orderCount === undefined || customer.avgOrderValue === undefined) {
                errors.push('topCustomers missing orderCount or avgOrderValue');
            } else {
                console.log('✅ Top Customers contain LTV metrics (Order Count, Avg Value)');
                console.log(`   - Top: ${customer.name} | Orders: ${customer.orderCount} | Avg: ₹${customer.avgOrderValue}`);
            }
        }

        if (errors.length > 0) {
            console.error('❌ VERIFICATION FAILED:');
            errors.forEach(err => console.error(`   - ${err}`));
            process.exit(1);
        }

        console.log('\n🎉 SUCCESS: All Phase 10 Analytics Metrics Verified!');

    } catch (error) {
        console.error('❌ Verification Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received from server at', error.config.url);
        }
        process.exit(1);
    }
}

verifyAnalytics();
