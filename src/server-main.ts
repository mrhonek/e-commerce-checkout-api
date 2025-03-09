/**
 * Main Entry Point - Simplified for debugging
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config();

// IMMEDIATE LOGGING FOR DEBUGGING
console.log('==========================================');
console.log('SERVER-MAIN.TS STARTED - DIRECT DB CONNECTION');
console.log('==========================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('Process arguments:', process.argv);
console.log('Current directory:', process.cwd());
console.log('==========================================');

// Express app setup
const app = express();
const port = process.env.PORT || 8080;

// CORS configuration with permissive settings
app.use(cors({
  origin: "*" // Allow all origins during development
}));

// Additional CORS headers for compatibility with frontend
app.use((req: Request, res: Response, next: NextFunction) => {
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

// Direct MongoDB connection test
async function testMongoConnection() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    return false;
  }

  try {
    console.log('Attempting direct MongoDB connection...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Direct MongoDB connection successful!');
    
    // Test query to get products collection count
    const db = client.db();
    const productsCollection = db.collection('products');
    const count = await productsCollection.countDocuments();
    console.log(`Found ${count} documents in products collection`);
    
    // Get first 5 products and log them
    const products = await productsCollection.find().limit(5).toArray();
    console.log('Sample products from database:');
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        _id: product._id,
        name: product.name,
        price: product.price
      });
    });
    
    await client.close();
    return true;
  } catch (error: any) {
    console.error('Direct MongoDB connection failed:', error.message);
    return false;
  }
}

// In-memory cart storage (temporary)
const cart: { items: any[] } = { items: [] };

// Very simple API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Using server-main.ts with direct MongoDB connection',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Direct products endpoint
app.get('/api/products', async (req: Request, res: Response) => {
  console.log('GET /api/products');
  
  try {
    // Direct MongoDB query for products
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({ error: 'MongoDB URI not configured' });
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().toArray();
    
    // Transform products for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      // Ensure these fields are available for the frontend
      _id: product._id.toString(), // Convert ObjectId to string
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    }));
    
    console.log(`Returning ${transformedProducts.length} products from database`);
    if (transformedProducts.length > 0) {
      console.log('Sample product:', {
        _id: transformedProducts[0]._id,
        name: transformedProducts[0].name,
        price: transformedProducts[0].price
      });
    } else {
      console.log('No products found in database');
    }
    
    await client.close();
    res.json(transformedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// Get featured products
app.get('/api/products/featured', async (req: Request, res: Response) => {
  console.log('GET /api/products/featured');
  
  try {
    // Direct MongoDB query for featured products
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({ error: 'MongoDB URI not configured' });
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const productsCollection = db.collection('products');
    const featuredProducts = await productsCollection.find({ isFeatured: true }).toArray();
    
    // Transform products for frontend compatibility
    const transformedProducts = featuredProducts.map(product => ({
      ...product,
      _id: product._id.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    }));
    
    console.log(`Returning ${transformedProducts.length} featured products from database`);
    await client.close();
    res.json(transformedProducts);
  } catch (error: any) {
    console.error('Error fetching featured products:', error.message);
    res.status(500).json({ error: 'Failed to fetch featured products', details: error.message });
  }
});

// Get a product by ID
app.get('/api/products/:id', async (req: Request, res: Response) => {
  console.log(`GET /api/products/${req.params.id}`);
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({ error: 'MongoDB URI not configured' });
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const productsCollection = db.collection('products');
    
    let product;
    
    // Check if ID is a valid MongoDB ObjectId
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
    } else {
      // Try to find by slug if not an ObjectId
      product = await productsCollection.findOne({ slug: req.params.id });
    }
    
    if (!product) {
      console.log(`Product with ID/slug ${req.params.id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Transform product for frontend compatibility
    const transformedProduct = {
      ...product,
      _id: product._id.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    };
    
    console.log('Returning product from database:', transformedProduct.name);
    await client.close();
    res.json(transformedProduct);
  } catch (error: any) {
    console.error(`Error fetching product ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// Cart endpoints
// Get cart
app.get('/api/cart', (req: Request, res: Response) => {
  res.json(cart);
});

// Add item to cart
app.post('/api/cart/items', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Get product details from database
    if (process.env.MONGODB_URI) {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db();
      const productsCollection = db.collection('products');
      
      let product;
      
      // Check if ID is a valid MongoDB ObjectId
      if (productId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      } else {
        // Try to find by slug if not an ObjectId
        product = await productsCollection.findOne({ slug: productId });
      }
      
      await client.close();
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Generate a unique item ID
      const itemId = `item_${Date.now()}`;
      
      // Add item to cart
      const cartItem = {
        itemId,
        productId,
        name: product.name,
        price: product.price,
        quantity: quantity || 1,
        imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
      };
      
      cart.items.push(cartItem);
      
      return res.status(201).json(cartItem);
    } else {
      return res.status(500).json({ error: 'Database connection not available' });
    }
  } catch (error: any) {
    console.error('Error adding item to cart:', error.message);
    res.status(500).json({ error: 'Failed to add item to cart', details: error.message });
  }
});

// Remove item from cart
app.delete('/api/cart/items/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => item.itemId !== itemId);
  
  if (cart.items.length === initialLength) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  res.status(200).json({ message: 'Item removed from cart' });
});

// Listen on port
app.listen(port, async () => {
  console.log(`Server (server-main.ts) running on port ${port}`);
  
  // Test MongoDB connection on startup
  const connected = await testMongoConnection();
  console.log('MongoDB connection test result:', connected ? 'SUCCESS' : 'FAILED');
}); 