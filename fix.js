// Fixed console.log lines
// Line 1027 - orders endpoint
console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');

// Line 1200 - checkout endpoint
console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...'); 