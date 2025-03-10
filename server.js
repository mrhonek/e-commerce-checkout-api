// Enhanced Express server with MongoDB connection
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const util = require('util');

const app = express();
const port = process.env.PORT || 8080;

// Enable more detailed console logging for debugging
console.log = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  const originalConsoleLog = console.info;
  originalConsoleLog.apply(console, [`[${timestamp}]`, ...args]);
};

console.error = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  const originalConsoleError = console.error;
  originalConsoleError.apply(console, [`[${timestamp}] ERROR:`, ...args]);
};

// Debug output
console.log('=== E-COMMERCE CHECKOUT API ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', port);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Email settings:', {
  EMAIL_HOST: process.env.EMAIL_HOST ? 'Set' : 'Not set',
  EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
  EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
  SMTP_HOST: process.env.SMTP_HOST ? 'Set' : 'Not set',
  SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Not set',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'Set' : 'Not set',
  EMAIL_FROM: process.env.EMAIL_FROM ? 'Set' : 'Not set'
});

// Configure email transporter
// For development, we'll use Ethereal (fake SMTP service)
let emailTransporter = null;
let emailSetupComplete = false;
let emailSetupError = null;

// Setup email transporter
async function setupEmailTransporter() {
  console.log('Starting email setup...');
  
  try {
    // Check both naming conventions for environment variables
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
    const from = process.env.EMAIL_FROM || 'shop@example.com';
    
    // If we have real email credentials in environment variables, use those
    if (host && user && pass) {
      console.log('Setting up email with real credentials');
      const transport = {
        host: host,
        port: port,
        secure: port === '465' || process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: user,
          pass: pass
        },
        // Add debug option for troubleshooting
        debug: true
      };
      
      console.log('Email transport config:', JSON.stringify({
        host: transport.host,
        port: transport.port,
        secure: transport.secure,
        auth: { user: transport.auth.user },
        fromEmail: from
      }));
      
      emailTransporter = nodemailer.createTransport(transport);
      
      // Verify the connection
      await emailTransporter.verify();
      console.log('Real email transporter configured and verified');
    } else {
      // For development/testing, create a test account with Ethereal
      console.log('No email credentials found in environment, setting up test account with Ethereal');
      const testAccount = await nodemailer.createTestAccount();
      
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        // Add debug option for troubleshooting
        debug: true
      });
      
      // Verify the connection
      await emailTransporter.verify();
      
      console.log('Test email account created and verified:', {
        user: testAccount.user,
        url: 'https://ethereal.email'
      });
      console.log('You can view test emails at https://ethereal.email using the credentials above');
    }
    
    emailSetupComplete = true;
    return emailTransporter;
  } catch (error) {
    console.error('Failed to set up email transporter:', error);
    emailSetupError = error;
    emailSetupComplete = true; // Consider it complete even though it failed
    return null;
  }
}

// Call the setup function and handle the promise
const emailSetupPromise = setupEmailTransporter()
  .then(transporter => {
    console.log('Email setup completed successfully:', !!transporter);
    return transporter;
  })
  .catch(error => {
    console.error('Email setup failed with error:', error);
    return null;
  });

// Function to send order confirmation email
async function sendOrderConfirmationEmail(order, customerEmail) {
  console.log('Attempting to send order confirmation email...');
  console.log('Order data for email:', JSON.stringify(order, null, 2).substring(0, 500) + '...');
  
  // If email setup is not complete, wait for it
  if (!emailSetupComplete) {
    console.log('Email setup not yet complete, waiting...');
    try {
      emailTransporter = await emailSetupPromise;
    } catch (error) {
      console.error('Error waiting for email setup:', error);
    }
  }
  
  if (!emailTransporter) {
    console.error('Email transporter not configured, skipping email confirmation');
    if (emailSetupError) {
      console.error('Email setup error was:', emailSetupError);
    }
    return;
  }
  
  try {
    // Extract customer email from order data
    const email = customerEmail || 
                 order.customer?.email || 
                 order.shipping?.email || 
                 order.billing?.email || 
                 'test@example.com';
    
    console.log(`Sending order confirmation to ${email}`);
    
    // Extract items from the order, checking multiple possible locations
    // This is important as different API endpoints might structure the data differently
    let orderItems = [];
    if (Array.isArray(order.items)) {
      orderItems = order.items;
    } else if (order.cart && Array.isArray(order.cart.items)) {
      orderItems = order.cart.items;
    } else if (Array.isArray(order.cart)) {
      orderItems = order.cart;
    } else if (order.products && Array.isArray(order.products)) {
      orderItems = order.products;
    } else if (order.orderItems && Array.isArray(order.orderItems)) {
      orderItems = order.orderItems;
    }
    
    console.log(`Found ${orderItems.length} items for email`);
    if (orderItems.length > 0) {
      console.log('Sample item:', JSON.stringify(orderItems[0]));
    }
    
    // Format items for email
    const itemsList = orderItems.length > 0 
      ? orderItems.map(item => {
          // Extract item data, checking different possible property names
          const name = item.name || item.productName || item.title || item.product?.name || 'Product';
          const quantity = item.quantity || 1;
          const price = item.price || item.unitPrice || item.product?.price || 0;
          const totalPrice = price * quantity;
          const sku = item.sku || item.id || item._id || item.productId || '';
          
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <div><strong>${name}</strong></div>
                <div style="color: #777; font-size: 12px;">SKU: ${sku}</div>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">$${Number(price).toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">$${Number(totalPrice).toFixed(2)}</td>
            </tr>
          `;
        }).join('') 
      : '<tr><td colspan="4" style="padding: 10px;">No items in order</td></tr>';
    
    // Calculate subtotal from items if not provided
    let subtotal = 0;
    if (order.subtotal) {
      subtotal = Number(order.subtotal);
    } else {
      // Calculate subtotal from items
      subtotal = orderItems.reduce((sum, item) => {
        const price = item.price || item.unitPrice || item.product?.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
    }
    
    // Get shipping cost
    let shipping = 0;
    if (order.shipping && order.shipping.cost) {
      shipping = Number(order.shipping.cost);
    } else if (order.shippingCost) {
      shipping = Number(order.shippingCost);
    } else if (order.shipping && typeof order.shipping === 'number') {
      shipping = Number(order.shipping);
    }
    
    // Get tax amount
    let tax = 0;
    if (order.tax) {
      tax = Number(order.tax);
    } else if (order.taxAmount) {
      tax = Number(order.taxAmount);
    }
    
    // Calculate total
    let orderTotal = 0;
    if (order.total) {
      orderTotal = Number(order.total);
    } else if (order.orderTotal) {
      orderTotal = Number(order.orderTotal);
    } else if (order.amount) {
      orderTotal = Number(order.amount);
    } else {
      // Calculate total from components
      orderTotal = subtotal + shipping + tax;
    }
    
    // Get shipping address for the email
    let shippingAddress = '';
    if (order.shipping && order.shipping.address) {
      const addr = order.shipping.address;
      shippingAddress = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Shipping Address</h3>
          <p>${addr.firstName || ''} ${addr.lastName || ''}</p>
          <p>${addr.address1 || addr.line1 || addr.street || ''}</p>
          ${addr.address2 || addr.line2 ? `<p>${addr.address2 || addr.line2 || ''}</p>` : ''}
          <p>${addr.city || ''}, ${addr.state || addr.province || ''} ${addr.postalCode || addr.zip || ''}</p>
          <p>${addr.country || ''}</p>
        </div>
      `;
    } else if (order.shippingAddress) {
      const addr = order.shippingAddress;
      shippingAddress = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Shipping Address</h3>
          <p>${addr.firstName || ''} ${addr.lastName || ''}</p>
          <p>${addr.address1 || addr.line1 || addr.street || ''}</p>
          ${addr.address2 || addr.line2 ? `<p>${addr.address2 || addr.line2 || ''}</p>` : ''}
          <p>${addr.city || ''}, ${addr.state || addr.province || ''} ${addr.postalCode || addr.zip || ''}</p>
          <p>${addr.country || ''}</p>
        </div>
      `;
    }
    
    // Get shipping method for the email
    let shippingMethod = '';
    if (order.shipping && order.shipping.method) {
      const method = order.shipping.method;
      const methodName = typeof method === 'string' ? method : method.name || 'Standard Shipping';
      const estDelivery = method.estimatedDelivery || '5-7 business days';
      
      shippingMethod = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Shipping Method</h3>
          <p>${methodName}</p>
          <p style="color: #777;">Estimated delivery: ${estDelivery}</p>
        </div>
      `;
    } else if (order.shippingMethod) {
      const method = order.shippingMethod;
      const methodName = typeof method === 'string' ? method : method.name || 'Standard Shipping';
      const estDelivery = method.estimatedDelivery || '5-7 business days';
      
      shippingMethod = `
        <div style="margin-top: 20px;">
          <h3 style="color: #333;">Shipping Method</h3>
          <p>${methodName}</p>
          <p style="color: #777;">Estimated delivery: ${estDelivery}</p>
        </div>
      `;
    }
    
    // Format the order ID to match the website display format
    const orderId = order.id || order.orderId || order._id || '';
    const formattedOrderId = orderId.startsWith('ORD-') ? orderId : `ORD-${orderId}`;
    
    // Use configured from email if available
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"E-Commerce Shop" <shop@example.com>';
    
    // Create email content
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Order Confirmed! #${formattedOrderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center; padding: 20px 0; border-bottom: 2px solid #eee;">Order Confirmed!</h1>
          
          <div style="padding: 20px;">
            <p>Thank you for your purchase. Your order has been received and is being processed.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h2 style="margin-top: 0; color: #333;">${formattedOrderId}</h2>
              <p>Placed on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            
            <h3 style="color: #333;">Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px; text-align: right; width: 80%;">Subtotal</td>
                  <td style="padding: 5px; text-align: right; width: 20%;">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; text-align: right; width: 80%;">Shipping</td>
                  <td style="padding: 5px; text-align: right; width: 20%;">$${shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; text-align: right; width: 80%;">Tax</td>
                  <td style="padding: 5px; text-align: right; width: 20%;">$${tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px; text-align: right; font-weight: bold; width: 80%;">Total</td>
                  <td style="padding: 5px; text-align: right; font-weight: bold; width: 20%;">$${orderTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            ${shippingAddress}
            ${shippingMethod}
            
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
    
    console.log('Prepared mail options:', { 
      from: mailOptions.from,
      to: mailOptions.to, 
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html
    });
    
    // Send the email
    console.log('Sending email now...');
    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('Order confirmation email sent:', info.messageId);
    
    // If using Ethereal, log the URL where the email can be viewed
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Print full error details for debugging
    console.error('Full error details:', util.inspect(error, { depth: null }));
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

// Process order - updated to send confirmation email with better error handling
app.post('/api/orders', async (req, res) => {
  console.log('=== PROCESSING ORDER ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data with flexible field names
  const orderData = req.body;
  
  // Check for cart/items using various possible field names
  let cart = orderData.cart || orderData.items || orderData.cartItems || { items: [] };
  let items = [];
  
  // Handle different cart structures
  if (Array.isArray(cart)) {
    // Cart is already an array of items
    items = cart;
    cart = { items };
  } else if (cart.items && Array.isArray(cart.items)) {
    // Cart has items array
    items = cart.items;
  } else if (typeof cart === 'object') {
    // Cart is an object but doesn't have items array
    items = [cart];
    cart = { items };
  }
  
  // Ensure each item has a consistent SKU format
  items = items.map(item => {
    const sku = item.sku || item.id || `item_${Date.now()}`;
    // Ensure SKU is consistently formatted
    const formattedSku = sku.startsWith('item_') ? sku : `item_${sku}`;
    return {
      ...item,
      sku: formattedSku
    };
  });
  
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
  
  // Calculate order total
  let total = 0;
  let subtotal = 0;
  let tax = 0;
  let shippingCost = 0;
  
  // Get shipping cost - either from the order data or use a default of $5.99
  shippingCost = orderData.shipping?.cost || orderData.shippingCost || 5.99;
  
  // Calculate subtotal from items
  if (items && items.length > 0) {
    subtotal = items.reduce((sum, item) => {
      const price = item.price || item.unitPrice || item.product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  } else if (orderData.subtotal) {
    subtotal = Number(orderData.subtotal);
  }
  
  // Calculate tax (default to 8% of subtotal)
  tax = orderData.tax || orderData.taxAmount || Number((subtotal * 0.08).toFixed(2));
  
  // Calculate final total
  total = subtotal + shippingCost + tax;
  
  console.log('Order components:', {
    subtotal,
    shipping: shippingCost,
    tax,
    total
  });
  
  // Mock order creation
  const order = {
    id: orderId,
    orderId: orderId, // Add alternative field name
    orderNumber: orderId, // Add another alternative
    created: new Date().toISOString(),
    status: 'processing',
    cart,
    items: items, // Add items directly for easier frontend access
    subtotal: subtotal,
    shipping: {
      ...shipping,
      cost: shippingCost
    },
    tax: tax,
    total: total, // Include calculated total
    payment: { 
      ...payment, 
      // Mask card number if present using various possible field names
      cardNumber: payment.cardNumber ? '****' + payment.cardNumber.slice(-4) : 
                 payment.card_number ? '****' + payment.card_number.slice(-4) : 
                 payment.number ? '****' + payment.number.slice(-4) : null 
    },
    customer
  };
  
  console.log('Successfully created order:', { 
    id: order.id, 
    status: order.status,
    itemCount: items.length,
    total: total
  });
  
  // Extract customer email for confirmation
  const customerEmail = customer.email || 
                       shipping.email || 
                       payment.email || 
                       orderData.email;
  
  console.log('Customer email extracted:', customerEmail);
  
  // Clear the cart after successful order
  cartData.items = [];
  
  // Send the response first to avoid timeout
  res.status(201).json(order);
  
  // Send confirmation email after response
  try {
    console.log('Calling email confirmation after response sent');
    const emailInfo = await sendOrderConfirmationEmail(order, customerEmail);
    console.log('Email confirmation completed, result:', !!emailInfo);
  } catch (error) {
    console.error('Error in email confirmation process:', error);
  }
  
  console.log('Order processing complete');
});

// Alternative checkout endpoint - also with email confirmation
app.post('/api/checkout', async (req, res) => {
  console.log('=== CHECKOUT ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data
  const orderData = req.body;
  
  // Extract items from various possible locations
  let items = [];
  if (Array.isArray(orderData.items)) {
    items = orderData.items;
  } else if (orderData.cart && Array.isArray(orderData.cart.items)) {
    items = orderData.cart.items;
  } else if (Array.isArray(orderData.cart)) {
    items = orderData.cart;
  } else if (orderData.products && Array.isArray(orderData.products)) {
    items = orderData.products;
  }
  
  // Calculate order total
  let total = 0;
  if (items && items.length > 0) {
    total = items.reduce((sum, item) => {
      const price = item.price || item.unitPrice || item.product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  } else if (orderData.total) {
    total = Number(orderData.total);
  }
  
  // Generate order ID
  const orderId = `order_${Date.now()}`;
  
  // Create order with minimal data
  const order = {
    id: orderId,
    orderId: orderId,
    orderNumber: orderId,
    created: new Date().toISOString(),
    status: 'processing',
    items: items,
    total: total,
    ...orderData
  };
  
  console.log('Checkout successful, created order:', { 
    id: order.id,
    itemCount: items.length,
    total: total
  });
  
  // Extract customer email for confirmation
  const customerEmail = orderData.customer?.email || 
                       orderData.shipping?.email || 
                       orderData.email || 
                       orderData.user?.email;
  
  console.log('Customer email extracted for checkout:', customerEmail);
  
  // Clear the cart after successful checkout
  cartData.items = [];
  
  // Send the response first to avoid timeout
  res.status(201).json(order);
  
  // Send confirmation email after response
  try {
    console.log('Calling email confirmation after checkout response sent');
    const emailInfo = await sendOrderConfirmationEmail(order, customerEmail);
    console.log('Checkout email confirmation completed, result:', !!emailInfo);
  } catch (error) {
    console.error('Error in checkout email confirmation process:', error);
  }
  
  console.log('Checkout processing complete');
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

// DELETE endpoint to clear the entire cart
app.delete('/api/cart', (req, res) => {
  console.log('DELETE /api/cart - Clearing entire cart');
  
  // Empty the cart
  cartData.items = [];
  
  console.log('Cart cleared');
  
  // Return empty cart
  return res.json({ items: [] });
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