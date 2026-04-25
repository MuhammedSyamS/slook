const path = require('path');

console.log("1. Checking paths...");
const orderControllerPath = path.resolve('./server/controllers/orderController.js');
console.log(`Order Controller Path: ${orderControllerPath}`);

console.log("2. Attempting receive imports one by one...");

try {
    console.log("- Requiring Order Model...");
    require('../server/models/Order');
    console.log("✅ Order Model Loaded");
} catch (e) {
    console.error("❌ Order Model Failed:", e.message);
}

try {
    console.log("- Requiring Product Model...");
    require('../server/models/Product');
    console.log("✅ Product Model Loaded");
} catch (e) {
    console.error("❌ Product Model Failed:", e.message);
}

try {
    console.log("- Requiring sendEmail Util...");
    require('../server/utils/sendEmail');
    console.log("✅ sendEmail Loaded");
} catch (e) {
    console.error("❌ sendEmail Failed:", e.message);
}

try {
    console.log("- Requiring emailTemplates Util...");
    require('../server/utils/emailTemplates');
    console.log("✅ emailTemplates Loaded");
} catch (e) {
    console.error("❌ emailTemplates Failed:", e.message);
}

try {
    console.log("- Requiring Server Entry (index.js)...");
    require('../server/index.js');
    console.log("✅ Server Entry Loaded");
} catch (e) {
    console.error("❌ Server Entry Failed:", e);
}
