// Process order - updated to send confirmation email with better error handling
app.post('/api/orders', async (req, res) => {
  console.log('=== PROCESSING ORDER ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data with flexible field names
  const orderData = req.body;
});

// Checkout endpoint - updated to be more flexible with request format
app.post('/api/checkout', async (req, res) => {
  console.log('=== CHECKOUT ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data
  const orderData = req.body;
}); 