const axios = require('axios');

// Mock Data
const ADMIN_EMAIL = 'superadmin@example.com';
const PASSWORD = 'password123';

async function runTest() {
    try {
        console.log("1. Login as Admin to get Token");
        let loginRes;
        try {
            loginRes = await axios.post('http://localhost:5005/api/users/login', {
                email: ADMIN_EMAIL,
                password: PASSWORD
            });
        } catch (e) {
            console.error("LOGIN FAILED:", e.message);
            if (e.response) console.error(JSON.stringify(e.response.data));
            return;
        }

        const token = loginRes.data.token;
        console.log("Admin logged in.");

        // 2. Mock Data
        console.log("2. Fetching Users list to debug");
        const listRes = await axios.get('http://localhost:5005/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        let userToUpdate = listRes.data.find(u => u.email === 'customer@example.com');

        if (!userToUpdate) {
            console.log("FAILURE: customer@example.com not found. Picking first non-admin...");
            userToUpdate = listRes.data.find(u => !u.isAdmin);
        }

        if (!userToUpdate) {
            console.log("FAILURE: No suitable user found to update.");
            return;
        }

        console.log(`Targeting: ${userToUpdate.email} (${userToUpdate._id})`);

        // 3. Update Role to Manager
        console.log("3. Test 1: Update to Manager (Product)");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const payload1 = {
            role: 'manager',
            permissions: ['manage_products']
        };

        const updateRes1 = await axios.put(`http://localhost:5005/api/users/${userToUpdate._id}/role`, payload1, config);
        console.log("Update 1 Status:", updateRes1.status);
        console.log("Update 1 Role:", updateRes1.data.role);
        console.log("Update 1 Perms:", JSON.stringify(updateRes1.data.permissions));

        // Verify
        if (updateRes1.data.role === 'manager' && updateRes1.data.permissions.includes('manage_products')) {
            console.log("SUCCESS: User is now Manager with manage_products");
        } else {
            console.log("FAILURE: User not updated correctly");
        }

        // 4. Update Role to Customer
        console.log("4. Test 2: Update back to Customer");
        const payload2 = {
            role: 'customer',
            permissions: []
        };
        const updateRes2 = await axios.put(`http://localhost:5005/api/users/${userToUpdate._id}/role`, payload2, config);
        console.log("Update 2 Role:", updateRes2.data.role);

        if (updateRes2.data.role === 'customer' && updateRes2.data.permissions.length === 0) {
            console.log("SUCCESS: User is now Customer");
        } else {
            console.log("FAILURE: User not updated correctly");
        }

    } catch (error) {
        console.error("TEST FAILED:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data));
        }
    }
}

runTest();
