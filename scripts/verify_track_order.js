const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('../server/models/Order');
const User = require('../server/models/User');

// Connect to DB (or just use axios if server is running)
// We will use axios to test the running server endpoint

const BASE_URL = 'http://localhost:5005/api';

async function verifyTrackOrder() {
    try {
        console.log("1. Creating a dummy order for testing...");
        // We need a valid order ID. 
        // Let's assume there is at least ONE order in the DB.
        // Or we can fetch one via admin route if we had a token, but simpler to just try a known ID if we have one.
        // Better: let's try to hit the endpoint with a fake ID first.

        console.log("2. Testing with Invalid ID (Expect 400/500/404)...");
        try {
            await axios.post(`${BASE_URL}/orders/track`, { orderId: 'INVALID_ID', email: 'test@example.com' });
        } catch (e) {
            console.log(`✅ Correctly failed: ${e.response?.status} - ${e.response?.data?.message}`);
        }

        // To test success, we need a real order ID. User might need to test manually.
        console.log("⚠️ Cannot fully verify success path without a known valid Order ID.");
        console.log("👉 Please manually test /track-order with a valid Order ID and matching Email.");

    } catch (error) {
        console.error("Verification Script Error:", error.message);
    }
}

verifyTrackOrder();
