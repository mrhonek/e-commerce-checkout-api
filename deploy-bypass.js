// Simple Express server for Railway deployment
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Temporary server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Simple API routes for testing
app.get('/api/shipping/options', (req, res) => {
  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDays: '3-5 business days'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: '1-2 business days'
    }
  ];
  
  res.status(200).json(shippingOptions);
});

// Start server
app.listen(port, () => {
  console.log(`Temporary server running on port ${port}`);
}); 