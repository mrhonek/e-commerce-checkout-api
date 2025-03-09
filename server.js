// Ultra-simplified Express server for deployment testing
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Debug output
console.log('=== STARTING SERVER ===');
console.log('Current directory:', __dirname);
console.log('Files in directory:');
try {
  require('fs').readdirSync(__dirname).forEach(file => {
    console.log(' - ' + file);
  });
} catch (err) {
  console.error('Error listing files:', err);
}
console.log('=======================');

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Simple API running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple products endpoint
app.get('/api/products', (req, res) => {
  console.log('GET /api/products');
  
  // Return a mock product
  const mockProducts = [
    { 
      _id: "prod1", 
      name: "Office Chair", 
      price: 249.99, 
      isFeatured: true, 
      imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" 
    }
  ];
  res.json(mockProducts);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 