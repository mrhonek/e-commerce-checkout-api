/**
 * TypeScript Server Entry Point
 * 
 * This is a TypeScript version of the server that uses TypeScript modules.
 * It will gradually replace the deploy-bypass.js file as more code is migrated.
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { initializeRoutes } from './routes';
import { loggerMiddleware } from './middleware';
import db from './db/connection';
import { corsHeadersMiddleware } from './middleware/cors.middleware';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 8080;

// CORS configuration with permissive settings
app.use(cors({
  origin: "*" // Allow all origins during development
}));

// Additional CORS headers for compatibility with frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://e-commerce-checkout-redesign.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample product data (we'll replace this with MongoDB connection later)
const products = [
  { 
    _id: "prod1", 
    name: "Ergonomic Office Chair", 
    description: "Premium ergonomic office chair with lumbar support and adjustable height.", 
    price: 249.99, 
    stockQuantity: 15, 
    isFeatured: true, 
    imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" 
  },
  { 
    _id: "prod2", 
    name: "Wireless Noise-Cancelling Headphones", 
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.", 
    price: 199.99, 
    stockQuantity: 25, 
    isFeatured: true, 
    imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" 
  },
  { 
    _id: "prod3", 
    name: "Smart Watch Series 5", 
    description: "Latest smart watch with health monitoring, GPS, and waterproof design.", 
    price: 329.99, 
    stockQuantity: 10, 
    isFeatured: false, 
    imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Smart+Watch" 
  },
  { 
    _id: "prod4", 
    name: "4K Ultra HD TV - 55 inch", 
    description: "Crystal clear 4K Ultra HD smart TV with HDR and voice control.", 
    price: 599.99, 
    stockQuantity: 8, 
    isFeatured: true, 
    imageUrl: "https://via.placeholder.com/400x300/f39c12/ffffff?text=4K+TV" 
  }
];

// In-memory cart storage
let cart = { items: [] };

// API Routes
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all products
app.get('/api/products', (req, res) => {
  console.log('GET /api/products');
  res.json(products);
});

// Get featured products
app.get('/api/products/featured', (req, res) => {
  console.log('GET /api/products/featured');
  const featuredProducts = products.filter(p => p.isFeatured);
  res.json(featuredProducts);
});

// Get a product by ID
app.get('/api/products/:id', (req, res) => {
  console.log(`GET /api/products/${req.params.id}`);
  const product = products.find(p => p._id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Get cart
app.get('/api/cart', (req, res) => {
  console.log('GET /api/cart');
  const cartWithIds = {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      id: item.itemId // Ensure id is present for frontend compatibility
    }))
  };
  res.json(cartWithIds);
});

// Add item to cart
app.post('/api/cart/items', (req, res) => {
  console.log('POST /api/cart/items - Request body:', JSON.stringify(req.body));
  
  const { productId, quantity } = req.body;
  
  if (!productId) {
    console.log('Missing productId in request');
    return res.status(400).json({ error: 'productId is required' });
  }
  
  if (!quantity || quantity < 1) {
    console.log('Invalid quantity in request');
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }
  
  const product = products.find(p => p._id === productId);
  if (!product) {
    console.log(`Product with ID ${productId} not found`);
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // Generate a unique itemId for this cart item
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create new cart item with both productId and itemId
  const newItem = {
    itemId,
    productId,
    name: product.name,
    price: product.price,
    quantity: Number(quantity)
  };
  
  cart.items.push(newItem);
  
  console.log(`Added item to cart. ItemId: ${itemId}, ProductId: ${productId}, Current cart size: ${cart.items.length}`);
  
  // Return the complete item including the generated itemId
  res.status(201).json(newItem);
});

// Update cart item
app.put('/api/cart/items/:itemId', (req, res) => {
  console.log(`PUT /api/cart/items/${req.params.itemId}`);
  
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity < 0) {
    console.log('Invalid quantity in request');
    return res.status(400).json({ error: 'quantity must be a non-negative number' });
  }
  
  const itemIndex = cart.items.findIndex(item => item.itemId === itemId);
  
  if (itemIndex === -1) {
    console.log(`Item with ID ${itemId} not found in cart`);
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  if (quantity === 0) {
    // Remove item if quantity is 0
    cart.items.splice(itemIndex, 1);
    console.log(`Removed item with ID ${itemId} from cart`);
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = Number(quantity);
    console.log(`Updated quantity of item with ID ${itemId} to ${quantity}`);
  }
  
  res.json(cart);
});

// Delete cart item
app.delete('/api/cart/items/:itemId', (req, res) => {
  console.log(`DELETE /api/cart/items/${req.params.itemId}`);
  
  const { itemId } = req.params;
  const itemIndex = cart.items.findIndex(item => item.itemId === itemId);
  
  if (itemIndex === -1) {
    console.log(`Item with ID ${itemId} not found in cart`);
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  cart.items.splice(itemIndex, 1);
  console.log(`Removed item with ID ${itemId} from cart`);
  
  res.json(cart);
});

// Shipping options
app.get('/api/shipping', (req, res) => {
  const shippingOptions = [
    { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: '3-5 business days' },
    { id: 'express', name: 'Express Shipping', price: 12.99, estimatedDays: '1-2 business days' },
    { id: 'free', name: 'Free Shipping', price: 0, estimatedDays: '5-7 business days' }
  ];
  res.json(shippingOptions);
});

// Payment methods
app.get('/api/payment-methods', (req, res) => {
  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card' },
    { id: 'paypal', name: 'PayPal' }
  ];
  res.json(paymentMethods);
});

// Connect to MongoDB
db.connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize all routes
    initializeRoutes(app);
    
    // Start server
    if (process.env.NODE_ENV !== 'test') {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`API available at http://localhost:${port}/api`);
      });
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

export default app; 