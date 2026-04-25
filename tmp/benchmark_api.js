const axios = require('axios');

const urls = [
    'http://localhost:5000/api/products',
    'http://localhost:3000/api/products', // Slook's proxy if it has one
    'http://localhost:5173/api/products'  // Client's proxy
];

async function benchmark() {
    for (const url of urls) {
        console.log(`\n🚀 Benchmarking ${url}...`);
        try {
            const start = Date.now();
            const response = await axios.get(url, { timeout: 10000 });
            const end = Date.now();
            console.log(`✅ Success: ${response.status}`);
            console.log(`⏱️ Duration: ${end - start}ms`);
            console.log(`📦 Payload size: ${JSON.stringify(response.data).length} bytes`);
        } catch (err) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
}

benchmark();
