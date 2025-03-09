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
import Product from './models/product.model';
import { IProductDocument } from './models/interfaces';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 8080;

// Print environment variables (without sensitive values)
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('============================');

// Connect to MongoDB - with retry logic
let isConnected = false;
const connectWithRetry = async (retries = 5, delay = 5000) => {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${currentTry + 1}/${retries})`);
      await db.connectDB();
      isConnected = true;
      console.log('Successfully connected to MongoDB!');
      console.log('MongoDB connection state:', db.getConnectionStateMessage());
      return;
    } catch (error) {
      console.error(`Connection attempt ${currentTry + 1} failed:`, error);
      currentTry++;
      
      if (currentTry < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('All connection attempts failed. Using fallback data.');
      }
    }
  }
};

// Start connection process
connectWithRetry();

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

// Fallback product data (used if database is empty)
const fallbackProducts = [
  { 
    name: "Ergonomic Office Chair", 
    slug: "ergonomic-office-chair",
    description: "Premium ergonomic office chair with lumbar support and adjustable height.", 
    price: 249.99, 
    stockQuantity: 15, 
    category: "Furniture",
    sku: "OFC-001",
    isInStock: true,
    isFeatured: true, 
    images: ["https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair"]
  },
  { 
    name: "Wireless Noise-Cancelling Headphones", 
    slug: "wireless-noise-cancelling-headphones",
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.", 
    price: 199.99, 
    stockQuantity: 25, 
    category: "Electronics",
    sku: "HDP-002",
    isInStock: true,
    isFeatured: true, 
    images: ["https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones"]
  },
  { 
    name: "Smart Watch Series 5", 
    slug: "smart-watch-series-5",
    description: "Latest smart watch with health monitoring, GPS, and waterproof design.", 
    price: 329.99, 
    stockQuantity: 10, 
    category: "Electronics",
    sku: "SWT-003",
    isInStock: true,
    isFeatured: false, 
    images: ["https://via.placeholder.com/400x300/2ecc71/ffffff?text=Smart+Watch"]
  },
  { 
    name: "4K Ultra HD TV - 55 inch", 
    slug: "4k-ultra-hd-tv-55-inch",
    description: "Crystal clear 4K Ultra HD smart TV with HDR and voice control.", 
    price: 599.99, 
    stockQuantity: 8, 
    category: "Electronics",
    sku: "TV4K-004",
    isInStock: true,
    isFeatured: true, 
    images: ["https://via.placeholder.com/400x300/f39c12/ffffff?text=4K+TV"]
  }
];

// Helper function to seed database
const seedDatabase = async () => {
  try {
    console.log('Seeding database with fallback products...');
    const result = await Product.insertMany(fallbackProducts);
    console.log(`Successfully seeded database with ${result.length} products`);
    return result;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Helper function to check if database needs seeding
const checkAndSeedDatabase = async () => {
  try {
    const count = await Product.countDocuments();
    console.log(`Found ${count} products in database`);
    
    if (count === 0) {
      return await seedDatabase();
    }
    
    return null;
  } catch (error) {
    console.error('Error checking database:', error);
    throw error;
  }
};

// In-memory cart storage (temporary until we implement MongoDB cart model)
let cart = { items: [] };

// API Routes
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    databaseStatus: db.getConnectionStateMessage(),
    databaseConnected: isConnected,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  console.log('GET /api/products');
  try {
    // Check if we're connected to MongoDB
    console.log(`MongoDB connection state: ${db.getConnectionStateMessage()} (${db.getConnectionState()})`);
    console.log('isConnected flag:', isConnected);
    
    // If not connected to MongoDB or in dev mode with no DB, use fallback data
    if (!isConnected || db.getConnectionState() !== 1) {
      console.log('MongoDB not connected. Using fallback products');
      // Transform fallback products to match expected format
      const mockedProducts = fallbackProducts.map((p, index) => ({
        ...p,
        _id: `prod${index + 1}`, // Explicitly set _id for frontend compatibility
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
      }));
      console.log('Returning mock products:', mockedProducts.length);
      return res.json(mockedProducts);
    }

    // Attempt to get products from database
    let products = await Product.find();
    console.log(`Found ${products.length} products in database`);
    
    // If no products in the database, seed the database with fallback products
    if (products.length === 0) {
      try {
        const seededProducts = await seedDatabase();
        if (seededProducts && seededProducts.length > 0) {
          products = await Product.find(); // Fetch again after seeding
          console.log(`Now have ${products.length} products in database after seeding`);
        }
      } catch (seedError) {
        console.error('Error seeding database:', seedError);
        // Return fallback products if seeding fails
        const mockedProducts = fallbackProducts.map((p, index) => ({
          ...p,
          _id: `prod${index + 1}`,
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
        }));
        return res.json(mockedProducts);
      }
    }
    
    // Transform products for frontend compatibility
    const transformedProducts = products.map(product => {
      // Check if product is a Mongoose document or plain object
      if (typeof product.toObject === 'function') {
        // Convert Mongoose document to plain object
        const productObj = product.toObject();
        console.log('Product from DB (after toObject):', {
          id: productObj._id,
          name: productObj.name,
          isFeatured: productObj.isFeatured
        });
        
        return {
          ...productObj,
          imageUrl: productObj.images && productObj.images.length > 0 ? productObj.images[0] : undefined
        };
      } else {
        // Already a plain object
        console.log('Product from DB (plain object):', {
          id: product._id,
          name: product.name,
          isFeatured: product.isFeatured
        });
        
        return {
          ...product,
          imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
        };
      }
    });
    
    console.log(`Returning ${transformedProducts.length} products from database`);
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Fall back to mock products in case of any error
    console.log('Returning fallback products due to error');
    const mockedProducts = fallbackProducts.map((p, index) => ({
      ...p,
      _id: `prod${index + 1}`,
      imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
    }));
    res.json(mockedProducts);
  }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  console.log('GET /api/products/featured');
  try {
    // Check database connection state first
    const connectionState = db.getConnectionState();
    console.log(`MongoDB connection state for featured products: ${db.getConnectionStateMessage()} (${connectionState})`);
    console.log('isConnected flag for featured products:', isConnected);
    
    if (!isConnected || connectionState !== 1) {
      console.log('MongoDB not connected for featured products. Using fallback products');
      const fallbackFeatured = fallbackProducts
        .filter(p => p.isFeatured)
        .map((p, index) => ({
          ...p,
          _id: `prod${index + 1}`,
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
        }));
      return res.json(fallbackFeatured);
    }
    
    // Get featured products from database
    const featuredProducts = await Product.find({ isFeatured: true });
    console.log(`Found ${featuredProducts.length} featured products in database`);
    
    // If no featured products in the database, use fallback
    if (featuredProducts.length === 0) {
      console.log('No featured products found in database. Checking if database needs seeding...');
      
      // Check if database has any products at all
      const totalProducts = await Product.countDocuments();
      
      if (totalProducts === 0) {
        // Database is empty, seed with fallback products
        try {
          const seededProducts = await seedDatabase();
          
          if (seededProducts && seededProducts.length > 0) {
            // Try to get featured products again
            const newFeaturedProducts = await Product.find({ isFeatured: true });
            console.log(`Found ${newFeaturedProducts.length} featured products after seeding`);
            
            if (newFeaturedProducts.length > 0) {
              // Transform for frontend compatibility
              const transformedFeatured = newFeaturedProducts.map(product => {
                const productObj = product.toObject ? product.toObject() : product;
                return {
                  ...productObj,
                  imageUrl: productObj.images && productObj.images.length > 0 ? productObj.images[0] : undefined
                };
              });
              
              return res.json(transformedFeatured);
            }
          }
        } catch (seedError) {
          console.error('Error seeding products for featured products:', seedError);
        }
      }
      
      // If no featured products after seeding or if seeding failed, return featured products from fallback data
      console.log('Using fallback featured products');
      const fallbackFeatured = fallbackProducts
        .filter(p => p.isFeatured)
        .map((p, index) => ({
          ...p,
          _id: `prod${index + 1}`,
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
        }));
      return res.json(fallbackFeatured);
    }
    
    // Transform for frontend compatibility
    const transformedFeatured = featuredProducts.map(product => {
      const productObj = product.toObject ? product.toObject() : product;
      console.log('Featured product from DB:', {
        id: productObj._id,
        name: productObj.name,
        isFeatured: productObj.isFeatured
      });
      return {
        ...productObj,
        imageUrl: productObj.images && productObj.images.length > 0 ? productObj.images[0] : undefined
      };
    });
    
    console.log(`Returning ${transformedFeatured.length} featured products from database`);
    res.json(transformedFeatured);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    // Return featured products from fallback data in case of any error
    console.log('Returning fallback featured products due to error');
    const fallbackFeatured = fallbackProducts
      .filter(p => p.isFeatured)
      .map((p, index) => ({
        ...p,
        _id: `prod${index + 1}`,
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined
      }));
    res.json(fallbackFeatured);
  }
});

// Get a product by ID
app.get('/api/products/:id', async (req, res) => {
  console.log(`GET /api/products/${req.params.id}`);
  
  try {
    // Check database connection state first
    const connectionState = db.getConnectionState();
    console.log(`MongoDB connection state: ${db.getConnectionStateMessage()} (${connectionState})`);
    
    // If ID is in "prodN" format, it's likely a mock product ID
    if (req.params.id.startsWith('prod')) {
      console.log(`ID ${req.params.id} matches mock product format`);
      const index = parseInt(req.params.id.substring(4)) - 1;
      
      if (index >= 0 && index < fallbackProducts.length) {
        const mockProduct = {
          ...fallbackProducts[index],
          _id: req.params.id,
          imageUrl: fallbackProducts[index].images && fallbackProducts[index].images.length > 0 
            ? fallbackProducts[index].images[0] 
            : undefined
        };
        console.log('Returning mock product:', mockProduct.name);
        return res.json(mockProduct);
      }
    }
    
    // If not connected to MongoDB, return 404 (already checked for mock product)
    if (!isConnected || connectionState !== 1) {
      console.log('MongoDB not connected and ID does not match any mock product');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Try to find the product in the database
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log(`Product with ID ${req.params.id} not found in database`);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Convert to plain object for frontend compatibility
    const productObj = product.toObject ? product.toObject() : product;
    const transformedProduct = {
      ...productObj,
      imageUrl: productObj.images && productObj.images.length > 0 ? productObj.images[0] : undefined
    };
    
    console.log('Returning product from database:', transformedProduct.name);
    res.json(transformedProduct);
  } catch (error) {
    console.error(`Error fetching product ${req.params.id}:`, error);
    
    // Check if it might be a mock product ID
    if (req.params.id.startsWith('prod')) {
      const index = parseInt(req.params.id.substring(4)) - 1;
      
      if (index >= 0 && index < fallbackProducts.length) {
        const mockProduct = {
          ...fallbackProducts[index],
          _id: req.params.id,
          imageUrl: fallbackProducts[index].images && fallbackProducts[index].images.length > 0 
            ? fallbackProducts[index].images[0] 
            : undefined
        };
        console.log('Returning mock product after DB error:', mockProduct.name);
        return res.json(mockProduct);
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch product' });
  }
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
app.post('/api/cart/items', async (req, res) => {
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
  
  try {
    const product = await Product.findById(productId);
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
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
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
  
  console.log("Updated cart:", JSON.stringify(cart));
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