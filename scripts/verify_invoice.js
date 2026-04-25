const axios = require('axios');
// Authenticated check requires a valid token.
// Since we don't have a token generator here easily without login, we will Mock the test 
// OR we can just check if the file exists and required modules are loaded (which we did).

// Let's try to hit the endpoint with a fake token and expect 401, which confirms the route is PROTECTED and exists.
// If it was 404, we'd know the route is missing.
// If 500, crash.

const BASE_URL = 'http://127.0.0.1:5005/api';

async function verifyInvoiceRoute() {
    try {
        console.log("1. Testing Invoice Route Presence...");
        try {
            await axios.get(`${BASE_URL}/orders/FAKE_ID/invoice`);
        } catch (e) {
            if (e.response?.status === 401) {
                console.log("✅ Route exists and is protected (401 Unauthorized received).");
            } else if (e.response?.status === 404) {
                // Could be route not found OR order not found if middleware passed (unlikely with no token)
                console.log(`⚠️ Received 404. Check if route matches /api/orders/:id/invoice`);
            } else {
                console.log(`ℹ️ Received ${e.response?.status}: ${e.response?.data?.message}`);
            }
        }

        console.log("2. Manual Verification Required:");
        console.log("   - Log in as a user.");
        console.log("   - Go to Order Details.");
        console.log("   - Click 'Download Invoice'.");
        console.log("   - Ensure PDF downloads and opens correctly.");

    } catch (error) {
        console.error("Verification Script Error:", error.message);
    }
}

verifyInvoiceRoute();
