const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const BASE_URL = 'http://127.0.0.1:5005/api';

async function testPdf() {
    try {
        console.log("1. Logging in as Admin...");
        const loginRes = await axios.post(`${BASE_URL}/users/login`, {
            email: 'admin_test@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const config = {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        };

        console.log("2. Requesting Order Operations PDF...");
        const pdfRes = await axios.get(`${BASE_URL}/reports/orders/pdf`, config);

        if (pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf') {
            console.log("✅ PDF Received successfully!");
            fs.writeFileSync('test_order_report.pdf', pdfRes.data);
            console.log("✅ File saved to 'test_order_report.pdf'. Size:", pdfRes.data.length, "bytes");
        } else {
            console.error("❌ Unexpected response:", pdfRes.status, pdfRes.headers['content-type']);
        }
    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data?.toString() || error.message);
    }
}

testPdf();
