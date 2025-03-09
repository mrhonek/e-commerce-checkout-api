// Simple Express server with MongoDB connection
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 8080;

// Logging startup info
console.log('=== E-Commerce Checkout API ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('=============================');

// Middleware
app.use(cors());
app.use(express.json());

// Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API running',
    mongodb: !!process.env.MONGODB_URI,
    env: process.env.NODE_ENV || 'development'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  console.log('GET /api/products');
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const products = await db.collection('products').find().toArray();
    console.log(`Found ${products.length} products in database`);
    
    // Transform products for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    }));
    
    if (transformedProducts.length > 0) {
      console.log('Sample product:', {
        _id: transformedProducts[0]._id,
        name: transformedProducts[0].name
      });
    }
    
    await client.close();
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Fallback to a simple mock product
    const mockProducts = [
      { 
        _id: "prod1", 
        name: "Office Chair", 
        price: 249.99, 
        isFeatured: true, 
        imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" 
      }
    ];
    console.log('Returning mock product as fallback');
    res.json(mockProducts);
  }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  console.log('GET /api/products/featured');
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const products = await db.collection('products').find({ isFeatured: true }).toArray();
    console.log(`Found ${products.length} featured products`);
    
    const transformedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    }));
    
    await client.close();
    res.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    
    // Fallback featured product
    const mockFeatured = [
      { 
        _id: "prod1", 
        name: "Office Chair", 
        price: 249.99, 
        isFeatured: true, 
        imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" 
      }
    ];
    res.json(mockFeatured);
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`GET /api/products/${id}`);
  
  try {
    const client = await connectToMongo();
    const db = client.db();
    let product;
    
    // Check if ID is a valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    } else {
      // Try by slug
      product = await db.collection('products').findOne({ slug: id });
    }
    
    if (!product) {
      await client.close();
      
      // If it's a mock product ID, return mock data
      if (id === 'prod1') {
        return res.json({ _id: "prod1", name: "Office Chair", price: 249.99, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" });
      }
      
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const transformedProduct = {
      ...product,
      _id: product._id.toString(),
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined
    };
    
    await client.close();
    res.json(transformedProduct);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    
    // Fallback for mock products
    if (id === 'prod1') {
      return res.json({ _id: "prod1", name: "Office Chair", price: 249.99, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" });
    }
    
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// In-memory cart storage (temporary until we implement MongoDB cart)
const cart = { items: [] };

// Get cart
app.get('/api/cart', (req, res) => {
  res.json(cart);
});

// Add item to cart
app.post('/api/cart/items', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  const itemId = `item_${Date.now()}`;
  
  // Add item to cart (in a real app, we'd get product details from DB)
  const cartItem = {
    itemId,
    productId,
    quantity
  };
  
  cart.items.push(cartItem);
  res.status(201).json(cartItem);
});

// Remove item from cart
app.delete('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => item.itemId !== itemId);
  
  if (cart.items.length === initialLength) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  res.status(200).json({ message: 'Item removed from cart' });
});

// Shipping options
app.get('/api/shipping', (req, res) => {
  const shippingOptions = [
    { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 12.99, estimatedDays: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 24.99, estimatedDays: '1 business day' }
  ];
  
  res.json(shippingOptions);
});

// Payment methods
app.get('/api/payment/methods', (req, res) => {
  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: 'credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'paypal' }
  ];
  
  res.json(paymentMethods);
});

// Process order
app.post('/api/orders', (req, res) => {
  const { cart, shipping, payment, customer } = req.body;
  
  if (!cart || !shipping || !payment || !customer) {
    return res.status(400).json({ error: 'Missing required order information' });
  }
  
  // In a real app, we would save the order to the database
  const orderId = `order_${Date.now()}`;
  
  // Mock order creation
  const order = {
    id: orderId,
    created: new Date().toISOString(),
    status: 'processing',
    cart,
    shipping,
    payment: { ...payment, cardNumber: payment.cardNumber ? '****' + payment.cardNumber.slice(-4) : null },
    customer
  };
  
  res.status(201).json(order);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
