// Enhanced Express server with MongoDB connection
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 8080;

// Debug output
console.log('=== E-COMMERCE CHECKOUT API ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', port);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Current directory:', __dirname);

// Configure email transporter
// For development, we'll use Ethereal (fake SMTP service)
let emailTransporter;

// Setup email transporter
async function setupEmailTransporter() {
  try {
    // If we have real email credentials in environment variables, use those
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Setting up email with real credentials');
      emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('Real email transporter configured');
    } else {
      // For development/testing, create a test account with Ethereal
      console.log('Setting up test email account with Ethereal');
      const testAccount = await nodemailer.createTestAccount();
      
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('Test email account created:', {
        user: testAccount.user,
        url: 'https://ethereal.email'
      });
      console.log('You can view test emails at https://ethereal.email using the credentials above');
    }
  } catch (error) {
    console.error('Failed to set up email transporter:', error);
  }
}

// Call the setup function
setupEmailTransporter();

// Function to send order confirmation email
async function sendOrderConfirmationEmail(order, customerEmail) {
  if (!emailTransporter) {
    console.log('Email transporter not configured, skipping email confirmation');
    return;
  }
  
  try {
    // Extract customer email from order data
    const email = customerEmail || 
                 order.customer?.email || 
                 order.shipping?.email || 
                 order.billing?.email || 
                 'customer@example.com';
    
    console.log(`Sending order confirmation to ${email}`);
    
    // Format items for email
    const itemsList = order.items && order.items.length > 0 
      ? order.items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price || 0).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `).join('') 
      : '<tr><td colspan="4" style="padding: 10px;">No items in order</td></tr>';
    
    // Calculate total
    const total = order.total || 
                 (order.items && order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)) || 
                 0;
    
    // Create email content
    const mailOptions = {
      from: '"E-Commerce Shop" <shop@example.com>',
      to: email,
      subject: `Order Confirmation #${order.id || order.orderId || 'Unknown'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center; padding: 20px 0; border-bottom: 2px solid #eee;">Order Confirmation</h1>
          
          <div style="padding: 20px;">
            <p>Dear Customer,</p>
            <p>Thank you for your order! We're pleased to confirm that we've received your order and it's being processed.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h2 style="margin-top: 0; color: #333;">Order Summary</h2>
              <p><strong>Order Number:</strong> ${order.id || order.orderId || 'Unknown'}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Order Status:</strong> ${order.status || 'Processing'}</p>
            </div>
            
            <h3 style="color: #333;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Product</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Quantity</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Price</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Order Total:</td>
                  <td style="padding: 10px; font-weight: bold;">$${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>If you have any questions about your order, please contact our customer service team.</p>
              <p>Thank you for shopping with us!</p>
            </div>
          </div>
          
          <div style="background-color: #333; color: white; padding: 15px; text-align: center; margin-top: 20px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} E-Commerce Shop. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    // Send the email
    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('Order confirmation email sent:', info.messageId);
    
    // If using Ethereal, log the URL where the email can be viewed
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

// Request logger middleware - add before other middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  console.log('Request query:', req.query);
  console.log('Request params:', req.params);

  // Capture the original res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    console.log(`Response for ${req.method} ${req.url}:`, 
                body ? JSON.stringify(body).substring(0, 200) + '...' : 'undefined');
    return originalJson.call(this, body);
  };
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Additional CORS headers for better compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// MongoDB connection helper
async function connectToMongo() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set, some functionality will be limited');
    return null;
  }
  
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Successfully connected to MongoDB');
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return null;
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.send('E-Commerce Checkout API is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: !!process.env.MONGODB_URI
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  console.log('GET /api/products');
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      const products = await db.collection('products').find().toArray();
      console.log(`Found ${products.length} products in database`);
      
      // Debug the image data structure of the first product
      if (products.length > 0) {
        console.log('Sample product image data:', {
          name: products[0].name,
          images: products[0].images,
          image: products[0].image,
          imageUrl: products[0].imageUrl,
          thumbnails: products[0].thumbnails
        });
      }
      
      // Transform products for frontend compatibility with better image and stock handling
      const transformedProducts = products.map(product => {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = product.images[0];
        } else if (product.image) {
          mainImage = product.image;
        } else if (product.imageUrl) {
          mainImage = product.imageUrl;
        } else {
          mainImage = "https://via.placeholder.com/400x300/3498db/ffffff?text=Product";
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        return {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both main and thumbnail (client will scale)
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock !== undefined ? product.inStock : 
                  product.stock !== undefined ? product.stock > 0 : 
                  product.quantity !== undefined ? product.quantity > 0 : 
                  true // Default to in stock if no stock info available
        };
      });
      
      // Log the first product for debugging
      if (transformedProducts.length > 0) {
        console.log('Sample product after transformation:', {
          _id: transformedProducts[0]._id,
          name: transformedProducts[0].name,
          imageUrl: transformedProducts[0].imageUrl,
          thumbnailUrl: transformedProducts[0].thumbnailUrl,
          price: transformedProducts[0].price,
          inStock: transformedProducts[0].inStock
        });
      }
      
      await client.close();
      
      if (transformedProducts.length > 0) {
        return res.json(transformedProducts);
      }
      // If no products found, fall through to mock data
      console.log('No products found in database, using fallback data');
    } else {
      console.log('No MongoDB connection, using fallback data');
    }
  } catch (error) {
    console.error('Error fetching products:', error.message);
  }
  
  // Fallback mock products (with price explicitly as number)
  const mockProducts = [
    { 
      _id: "prod1", 
      name: "Office Chair", 
      price: 249.99, 
      isFeatured: true, 
      imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
      thumbnailUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
      inStock: true 
    },
    { 
      _id: "prod2", 
      name: "Headphones", 
      price: 199.99, 
      isFeatured: true, 
      imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
      thumbnailUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
      inStock: true
    },
    { 
      _id: "prod3", 
      name: "Laptop Stand", 
      price: 79.99, 
      isFeatured: false, 
      imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Laptop+Stand",
      thumbnailUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Laptop+Stand",
      inStock: true
    }
  ];
  console.log('Returning mock products as fallback');
  res.json(mockProducts);
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  console.log('GET /api/products/featured');
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      const products = await db.collection('products').find({ isFeatured: true }).toArray();
      console.log(`Found ${products.length} featured products in database`);
      
      // Use the same transformation logic for consistency
      const transformedProducts = products.map(product => {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = product.images[0];
        } else if (product.image) {
          mainImage = product.image;
        } else if (product.imageUrl) {
          mainImage = product.imageUrl;
        } else {
          mainImage = "https://via.placeholder.com/400x300/3498db/ffffff?text=Product";
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        return {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both main and thumbnail (client will scale)
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock !== undefined ? product.inStock : 
                  product.stock !== undefined ? product.stock > 0 : 
                  product.quantity !== undefined ? product.quantity > 0 : 
                  true
        };
      });
      
      await client.close();
      
      if (transformedProducts.length > 0) {
        return res.json(transformedProducts);
      }
      // If no featured products found, fall through to mock data
    }
  } catch (error) {
    console.error('Error fetching featured products:', error.message);
  }
  
  // Fallback featured products (with price explicitly as number and thumbnails)
  const mockFeatured = [
    { 
      _id: "prod1", 
      name: "Office Chair", 
      price: 249.99, 
      isFeatured: true, 
      imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
      thumbnailUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
      inStock: true
    },
    { 
      _id: "prod2", 
      name: "Headphones", 
      price: 199.99, 
      isFeatured: true, 
      imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
      thumbnailUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
      inStock: true
    }
  ];
  console.log('Returning mock featured products as fallback');
  res.json(mockFeatured);
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`GET /api/products/${id}`);
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      let product;
      
      // Check if ID is a valid MongoDB ObjectId
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        product = await db.collection('products').findOne({ _id: new ObjectId(id) });
      } else {
        // Try by product slug if not an ObjectId
        product = await db.collection('products').findOne({ slug: id });
      }
      
      await client.close();
      
      if (product) {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = product.images[0];
        } else if (product.image) {
          mainImage = product.image;
        } else if (product.imageUrl) {
          mainImage = product.imageUrl;
        } else {
          mainImage = "https://via.placeholder.com/400x300/3498db/ffffff?text=Product";
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        // Use the same transformation logic for consistency
        const transformedProduct = {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both main and thumbnail
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock !== undefined ? product.inStock : 
                  product.stock !== undefined ? product.stock > 0 : 
                  product.quantity !== undefined ? product.quantity > 0 : 
                  true // Default to in stock if no stock info available
        };
        
        console.log('Product after transformation:', {
          _id: transformedProduct._id,
          name: transformedProduct.name,
          price: transformedProduct.price,
          imageUrl: transformedProduct.imageUrl,
          thumbnailUrl: transformedProduct.thumbnailUrl,
          inStock: transformedProduct.inStock
        });
        
        return res.json(transformedProduct);
      }
    }
    
    // If product not found in DB or no DB connection, check for mock products
    if (id === 'prod1') {
      return res.json({ 
        _id: "prod1", 
        name: "Office Chair", 
        price: 249.99, 
        isFeatured: true, 
        imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
        thumbnailUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair",
        inStock: true 
      });
    } else if (id === 'prod2') {
      return res.json({ 
        _id: "prod2", 
        name: "Headphones", 
        price: 199.99, 
        isFeatured: true, 
        imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
        thumbnailUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones",
        inStock: true
      });
    } else if (id === 'prod3') {
      return res.json({ 
        _id: "prod3", 
        name: "Laptop Stand", 
        price: 79.99, 
        isFeatured: false, 
        imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Laptop+Stand",
        thumbnailUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Laptop+Stand",
        inStock: true
      });
    }
    
    // If not a known mock product ID, return 404
    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Reset the cart to use a consistent object structure with items array
const cartData = {
  items: []
};

// Simple GET /api/cart - returns object with items array
app.get('/api/cart', (req, res) => {
  console.log('GET /api/cart returning:', { items: cartData.items });
  // Return a consistent structure that frontend can map over
  res.json({ items: cartData.items });
});

// Basic add to cart - returns object with items array
app.post('/api/cart/items', async (req, res) => {
  console.log('POST /api/cart/items with body:', req.body);
  try {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Generate a unique item ID
    const itemId = `item_${Date.now()}`;
    
    // Get product details from MongoDB if possible
    let name = '';
    let price = 0;
    let imageUrl = '';
    
    // Try to get product details from database
    const client = await connectToMongo();
    if (client) {
      const db = client.db();
      
      let product = null;
      if (productId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
      }
      
      if (product) {
        name = product.name || '';
        price = typeof product.price === 'number' ? product.price : 
                typeof product.price === 'string' ? parseFloat(product.price) : 0;
        imageUrl = product.images && product.images.length > 0 ? product.images[0] : 
                   product.image || product.imageUrl || '';
      }
      
      await client.close();
    }
    
    // Create a simple cart item
    const newItem = {
      id: itemId,
      productId,
      quantity: Number(quantity),
      name,
      price,
      imageUrl
    };
    
    // Add to cart
    cartData.items.push(newItem);
    
    console.log('Updated cart:', { items: cartData.items });
    
    // Return consistent { items: [] } structure
    return res.json({ items: cartData.items });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Basic delete from cart
app.delete('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  console.log(`DELETE /api/cart/items/${itemId}`);
  
  // Filter out the item
  cartData.items = cartData.items.filter(item => item.id !== itemId);
  
  // Return consistent { items: [] } structure
  return res.json({ items: cartData.items });
});

// Update cart item quantity
app.put('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  console.log(`PUT /api/cart/items/${itemId} with quantity:`, quantity);
  
  if (!quantity || isNaN(Number(quantity))) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  
  // Find the item in the cart
  const itemIndex = cartData.items.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  // Update the quantity
  cartData.items[itemIndex].quantity = Number(quantity);
  
  console.log('Updated cart item quantity, new cart:', { items: cartData.items });
  
  // Return the same format as other cart endpoints
  return res.json({ items: cartData.items });
});

// Add PATCH endpoint as an alternative for updating quantity
app.patch('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  console.log(`PATCH /api/cart/items/${itemId} with quantity:`, quantity);
  
  if (!quantity || isNaN(Number(quantity))) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  
  // Find the item in the cart
  const itemIndex = cartData.items.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  // Update the quantity
  cartData.items[itemIndex].quantity = Number(quantity);
  
  console.log('Updated cart item quantity, new cart:', { items: cartData.items });
  
  // Return the same format as other cart endpoints
  return res.json({ items: cartData.items });
});

// Add endpoint for updating entire cart
app.put('/api/cart', (req, res) => {
  const { items } = req.body;
  
  console.log('PUT /api/cart with body:', req.body);
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Cart items array is required' });
  }
  
  // Replace the cart items
  cartData.items = items.map(item => ({
    ...item,
    quantity: Number(item.quantity)
  }));
  
  console.log('Replaced cart items, new cart:', { items: cartData.items });
  
  // Return the same format as other cart endpoints
  return res.json({ items: cartData.items });
});

// Add other non-cart related endpoints here
// ...

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

// Process order - updated to send confirmation email
app.post('/api/orders', (req, res) => {
  console.log('=== PROCESSING ORDER ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data with flexible field names
  const orderData = req.body;
  
  // Check for cart/items using various possible field names
  const cart = orderData.cart || orderData.items || orderData.cartItems || { items: [] };
  
  // Check for shipping info using various possible field names
  const shipping = orderData.shipping || orderData.shippingInfo || orderData.shippingMethod || orderData.delivery || {};
  
  // Check for payment info using various possible field names
  const payment = orderData.payment || orderData.paymentInfo || orderData.paymentMethod || orderData.billing || {};
  
  // Check for customer info using various possible field names
  const customer = orderData.customer || orderData.customerInfo || orderData.user || orderData.billingInfo || orderData.contact || {};
  
  console.log('Extracted cart:', cart);
  console.log('Extracted shipping:', shipping);
  console.log('Extracted payment:', payment);
  console.log('Extracted customer:', customer);
  
  // More flexible validation - just ensure we have some minimal data
  if ((!cart || typeof cart !== 'object') && 
      (!shipping || typeof shipping !== 'object') && 
      (!payment || typeof payment !== 'object') && 
      (!customer || typeof customer !== 'object')) {
    console.log('Order validation failed: Missing required order information');
    return res.status(400).json({ 
      error: 'Missing required order information',
      received: orderData
    });
  }
  
  // In a real app, we would save the order to the database
  const orderId = `order_${Date.now()}`;
  
  // Mock order creation
  const order = {
    id: orderId,
    orderId: orderId, // Add alternative field name
    orderNumber: orderId, // Add another alternative
    created: new Date().toISOString(),
    status: 'processing',
    cart,
    items: cart.items || [], // Add items directly for easier frontend access
    shipping,
    payment: { 
      ...payment, 
      // Mask card number if present using various possible field names
      cardNumber: payment.cardNumber ? '****' + payment.cardNumber.slice(-4) : 
                 payment.card_number ? '****' + payment.card_number.slice(-4) : 
                 payment.number ? '****' + payment.number.slice(-4) : null 
    },
    customer
  };
  
  console.log('Successfully created order:', { id: order.id, status: order.status });
  
  // Extract customer email for confirmation
  const customerEmail = customer.email || 
                       shipping.email || 
                       payment.email || 
                       orderData.email;
  
  // Send confirmation email
  sendOrderConfirmationEmail(order, customerEmail)
    .then(info => {
      console.log('Email confirmation sent or attempted');
    })
    .catch(error => {
      console.error('Error sending confirmation email:', error);
    });
  
  console.log('=======================');
  
  // Clear the cart after successful order
  cartData.items = [];
  
  res.status(201).json(order);
});

// Alternative checkout endpoint - also with email confirmation
app.post('/api/checkout', (req, res) => {
  console.log('=== CHECKOUT ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data
  const orderData = req.body;
  
  // Generate order ID
  const orderId = `order_${Date.now()}`;
  
  // Create order with minimal data
  const order = {
    id: orderId,
    orderId: orderId,
    orderNumber: orderId,
    created: new Date().toISOString(),
    status: 'processing',
    ...orderData
  };
  
  console.log('Checkout successful, created order:', { id: order.id });
  
  // Extract customer email for confirmation
  const customerEmail = orderData.customer?.email || 
                       orderData.shipping?.email || 
                       orderData.email || 
                       orderData.user?.email;
  
  // Send confirmation email
  sendOrderConfirmationEmail(order, customerEmail)
    .then(info => {
      console.log('Email confirmation sent or attempted');
    })
    .catch(error => {
      console.error('Error sending confirmation email:', error);
    });
  
  // Clear the cart after successful checkout
  cartData.items = [];
  
  res.status(201).json(order);
});

// Add a specialized endpoint for getting cart with product details
app.get('/api/cart/with-products', async (req, res) => {
  console.log('GET /api/cart/with-products');
  
  // Calculate totals but don't store them on the cart object
  const totals = updateCartTotals();
  
  // Array to hold cart items with product details
  const cartItemsWithProducts = [];
  
  // Try to get product details for each cart item
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      
      // For each cart item, try to get product details
      for (const item of cart.items) {
        let product = null;
        
        // Try to find the product in the database
        if (item.productId.match(/^[0-9a-fA-F]{24}$/)) {
          product = await db.collection('products').findOne({ _id: new ObjectId(item.productId) });
        }
        
        if (product) {
          // Add product details to cart item
          cartItemsWithProducts.push({
            ...item,
            product: {
              _id: product._id.toString(),
              name: product.name,
              price: product.price,
              imageUrl: product.images && product.images.length > 0 ? product.images[0] : 
                      product.image || product.imageUrl || ''
            }
          });
        } else {
          // If product not found, just use the cart item as is
          cartItemsWithProducts.push(item);
        }
      }
      
      await client.close();
    } else {
      // If no MongoDB connection, just use cart items as is
      cartItemsWithProducts.push(...cart.items);
    }
  } catch (error) {
    console.error('Error getting product details for cart:', error);
    // In case of error, just use cart items as is
    cartItemsWithProducts.push(...cart.items);
  }
  
  // Return a specialized response with all the details
  res.status(200).json({
    items: cartItemsWithProducts,
    total: totals.total || 0,
    subtotal: totals.subtotal || 0,
    totalItems: totals.totalItems || 0
  });
});

// Generic catch-all endpoint for debugging
app.all('/api/*', (req, res) => {
  console.log(`UNHANDLED ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  
  res.status(200).json({
    message: `Received ${req.method} request to ${req.url}`,
    body: req.body,
    query: req.query,
    params: req.params
  });
});

// Echo API to help debug frontend requests
app.all('/api/echo', (req, res) => {
  console.log('=== ECHO API CALL ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('====================');
  
  // Return exactly what was received
  res.json({
    method: req.method,
    url: req.url,
    body: req.body,
    headers: {
      contentType: req.headers['content-type'],
      accept: req.headers['accept']
    }
  });
});

// Expose cart in multiple formats to catch any frontend expectations
app.get('/api/cart-debug', (req, res) => {
  res.json({
    // Format 1: Current format
    standard: { items: cartData.items },
    // Format 2: Just the array
    array: cartData.items,
    // Format 3: Empty for now
    empty: { items: [] },
    // Format 4: Null items array
    withNull: { items: null },
    // Format 5: No items property
    withoutItems: {}
  });
});

// Special cart endpoint that checks if frontend is sending proper data when adding items
app.post('/api/add-to-cart-debug', (req, res) => {
  console.log('=== ADD TO CART DEBUG ===');
  console.log('Request body:', req.body);
  
  const productId = req.body.productId || req.body.product_id || req.body.id;
  const quantity = req.body.quantity || 1;
  
  console.log('Extracted productId:', productId);
  console.log('Extracted quantity:', quantity);
  console.log('========================');
  
  if (!productId) {
    return res.status(400).json({
      error: 'No product ID found in request',
      receivedBody: req.body
    });
  }
  
  // Return current cart as items property
  return res.json({ items: cartData.items });
});

// Add more extensive debugging for all cart requests
app.use('/api/cart*', (req, res, next) => {
  console.log('=== CART REQUEST DEBUGGING ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Path:', req.path);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', {
    contentType: req.headers['content-type'],
    accept: req.headers.accept
  });
  console.log('============================');
  next();
});

// Add more flexible update endpoint that checks various request formats
app.all('/api/cart/update*', (req, res) => {
  console.log('=== FLEXIBLE CART UPDATE ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  
  // Try to extract itemId and quantity from various locations
  let itemId = req.params.itemId || req.query.itemId || req.query.id || req.body.itemId || req.body.id;
  let quantity = req.body.quantity || req.query.quantity || 1;
  
  console.log('Extracted itemId:', itemId);
  console.log('Extracted quantity:', quantity);
  
  if (!itemId) {
    return res.status(400).json({ error: 'Item ID is required' });
  }
  
  // Find the item
  const itemIndex = cartData.items.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  // Update quantity
  cartData.items[itemIndex].quantity = Number(quantity);
  
  // Return the standard format
  return res.json({ items: cartData.items });
});

// Order success/confirmation endpoint
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  console.log(`GET /api/orders/${orderId}`);
  
  // Create a mock order for confirmation
  const order = {
    id: orderId,
    orderId: orderId,
    orderNumber: orderId,
    created: new Date().toISOString(),
    status: 'processing',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: cartData.items,
    total: cartData.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0)
  };
  
  res.json(order);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 