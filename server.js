// Enhanced Express server with MongoDB connection
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const util = require('util');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Store original console methods before overriding
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Enable more detailed console logging for debugging
console.log = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  originalConsoleLog.apply(console, [`[${timestamp}]`, ...args]);
};

console.error = function() {
  const timestamp = new Date().toISOString();
  const args = Array.from(arguments);
  originalConsoleError.apply(console, [`[${timestamp}] ERROR:`, ...args]);
};

// Debug output
console.log('=== RHNKSHOP CHECKOUT API ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', port);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
console.log('Stripe API Key exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe Webhook Secret exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
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
  
  // Debug all email-related environment variables  
  console.log('Email environment variables:');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('- SMTP_FROM:', process.env.SMTP_FROM);
  console.log('- EMAIL_USER:', process.env.EMAIL_USER);
  console.log('- SMTP_USER:', process.env.SMTP_USER);
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('- SMTP_HOST:', process.env.SMTP_HOST);
  
  try {
    // Check both naming conventions for environment variables
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
    
    // IMPORTANT: Define the from address here to pass directly to transport config
    // Don't defer it to the mail options since that might not be respected
    let fromAddress = null;
    
    // Try EMAIL_FROM first
    if (process.env.EMAIL_FROM) {
      fromAddress = process.env.EMAIL_FROM;
      console.log('Using EMAIL_FROM for from address:', fromAddress);
    } 
    // Then try SMTP_FROM
    else if (process.env.SMTP_FROM) {
      fromAddress = process.env.SMTP_FROM;
      console.log('Using SMTP_FROM for from address:', fromAddress);
    } 
    // Format with RhnkShop name + user email if no explicit FROM set
    else if (user) {
      // Make sure it's properly formatted with name + angle brackets
      if (!user.includes('<') && !user.includes('>')) {
        fromAddress = `"RhnkShop" <${user}>`;
      } else {
        fromAddress = user;
      }
      console.log('Using formatted user email for from address:', fromAddress);
    } 
    // Last resort fallback
    else {
      fromAddress = '"RhnkShop" <shop@example.com>';
      console.log('Using fallback for from address:', fromAddress);
    }
    
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
        // Force the from address at the transport level
        from: fromAddress,
        // Add debug option for troubleshooting
        debug: true
      };
      
      console.log('Email transport config:', JSON.stringify({
        host: transport.host,
        port: transport.port,
        secure: transport.secure,
        auth: { user: transport.auth.user },
        fromEmail: fromAddress
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
    
    // Get the from email address directly from the transporter if possible
    // This is the most reliable way to ensure it's consistent
    let fromEmail = emailTransporter.options?.from || process.env.EMAIL_FROM;
    
    // If that's not available, try the other sources
    if (!fromEmail) {
      if (process.env.EMAIL_FROM) {
        fromEmail = process.env.EMAIL_FROM;
      } else if (process.env.SMTP_FROM) {
        fromEmail = process.env.SMTP_FROM;
      } else {
        // Last resort - format with RhnkShop name
        const user = process.env.EMAIL_USER || process.env.SMTP_USER;
        if (user) {
          fromEmail = `"RhnkShop" <${user}>`;
        } else {
          fromEmail = '"RhnkShop" <shop@example.com>';
        }
      }
    }
    
    console.log(`Using from email for order confirmation: "${fromEmail}"`);
    
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
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} RhnkShop. All rights reserved.</p>
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

// Middleware
app.use(cors());

// Serve static files from a public directory
app.use('/static', express.static('public'));

// Create public/images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'public', 'images');

try {
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'));
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
  }
  console.log('Static directories setup complete');
} catch (error) {
  console.error('Error setting up static directories:', error);
}

// Helper function to construct proper image URLs
function getImageUrl(imagePath) {
  if (!imagePath) {
    return '/images/sample/placeholder.jpg';
  }
  
  // If it's already a complete URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle various relative paths by standardizing them
  if (imagePath.startsWith('/public/')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/images/')) {
    return imagePath;
  }
  
  // For product1.jpg, product2.jpg etc., use the sample images directory
  if (imagePath.match(/^product\d+\.jpg$/)) {
    return `/images/sample/${imagePath}`;
  }
  
  // Default case - assume it's in the sample images directory
  return `/images/sample/${imagePath}`;
}

// Add placeholder image URLs to use as fallbacks
const placeholderImages = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
];

// Get random placeholder image
function getPlaceholderImage(productName) {
  if (!productName) return placeholderImages[0];
  // Use product name to deterministically select an image (for consistency)
  const index = productName.length % placeholderImages.length;
  return placeholderImages[index];
}

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

// Express middleware for JSON parsing
// This is the only express.json() middleware we should have
app.use(express.json({
  // Use raw body for Stripe webhook verification
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook/stripe')) {
      req.rawBody = buf.toString();
    }
  }
}));

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

// Enhanced seed products with proper categories
const enhancedMockProducts = [
  // Home & Kitchen category items
  { 
    _id: "homekit1", 
    name: "Coffee Maker", 
    description: "Premium coffee maker with timer and auto-shutoff",
    price: 79.99, 
    category: "Home & Kitchen",
    featured: true,
    inStock: true,
    rating: 4.7,
    reviews: 128,
    // Using our sample images
    imageUrl: getImageUrl("product1.jpg")
  },
  { 
    _id: "homekit2", 
    name: "Blender", 
    description: "High-power blender for smoothies and food prep",
    price: 59.99, 
    category: "Home & Kitchen",
    featured: false,
    inStock: true,
    rating: 4.5,
    reviews: 94,
    imageUrl: getImageUrl("product2.jpg")
  },
  
  // Beauty category items
  { 
    _id: "beauty1", 
    name: "Face Serum", 
    description: "Hydrating face serum with vitamin C",
    price: 24.99, 
    category: "Beauty",
    featured: false,
    inStock: true,
    rating: 4.8,
    reviews: 156,
    imageUrl: getImageUrl("product3.jpg")
  },
  { 
    _id: "beauty2", 
    name: "Makeup Brush Set", 
    description: "Professional makeup brush set with carrying case",
    price: 34.99, 
    category: "Beauty",
    featured: true,
    inStock: true,
    rating: 4.6,
    reviews: 87,
    imageUrl: getImageUrl("product4.jpg")
  },
  
  // Sale items
  { 
    _id: "sale1", 
    name: "Wireless Earbuds", 
    description: "Noise-cancelling wireless earbuds with charging case",
    price: 49.99, 
    originalPrice: 99.99,
    category: "Electronics",
    featured: false,
    inStock: true,
    onSale: true,
    rating: 4.4,
    reviews: 210,
    tags: ["sale"],
    imageUrl: getPlaceholderImage("Wireless Earbuds")
  },
  { 
    _id: "sale2", 
    name: "Winter Jacket", 
    description: "Water-resistant winter jacket with thermal lining",
    price: 79.99, 
    originalPrice: 149.99,
    category: "Clothing",
    featured: false,
    inStock: true,
    onSale: true,
    rating: 4.3,
    reviews: 76,
    tags: ["sale"],
    imageUrl: getPlaceholderImage("Winter Jacket")
  },
  
  // Deals items
  { 
    _id: "deal1", 
    name: "Smart Speaker", 
    description: "Voice-controlled smart speaker with virtual assistant",
    price: 39.99, 
    originalPrice: 59.99,
    category: "Electronics",
    featured: true,
    inStock: true,
    isDeal: true,
    rating: 4.5,
    reviews: 188,
    tags: ["deal", "hot"],
    imageUrl: getPlaceholderImage("Smart Speaker")
  },
  { 
    _id: "deal2", 
    name: "Kitchen Knife Set", 
    description: "Professional chef knife set with wooden block",
    price: 69.99, 
    originalPrice: 99.99,
    category: "Home & Kitchen",
    featured: false,
    inStock: true,
    isDeal: true,
    rating: 4.9,
    reviews: 132,
    tags: ["deal"],
    imageUrl: getPlaceholderImage("Kitchen Knife Set")
  },
  
  // Keep original items but update with categories
  { 
    _id: "prod1", 
    name: "Office Chair", 
    description: "Ergonomic office chair with lumbar support",
    price: 249.99, 
    category: "Furniture",
    featured: true, 
    inStock: true,
    rating: 4.6,
    reviews: 154,
    imageUrl: getImageUrl("product1.jpg")
  },
  { 
    _id: "prod2", 
    name: "Headphones", 
    description: "Over-ear headphones with noise cancellation",
    price: 199.99, 
    category: "Electronics",
    featured: true, 
    inStock: true,
    rating: 4.8,
    reviews: 203,
    imageUrl: getImageUrl("product2.jpg")
  },
  { 
    _id: "prod3", 
    name: "Laptop Stand", 
    description: "Adjustable laptop stand for better ergonomics",
    price: 79.99, 
    category: "Electronics",
    featured: false, 
    inStock: true,
    rating: 4.5,
    reviews: 88,
    imageUrl: getImageUrl("product3.jpg")
  }
];

// Instead of reassigning the array, update products in place
// Mark some products as on sale or deals
enhancedMockProducts.forEach((product, index) => {
  // Mark every third product as on sale
  if (index % 3 === 0) {
    product.onSale = true;
    product.originalPrice = (product.price * 1.25).toFixed(2);
    product.tags = [...(product.tags || []), 'sale'];
  }
  
  // Mark every fourth product as a deal
  if (index % 4 === 0) {
    product.isDeal = true;
    product.tags = [...(product.tags || []), 'deal'];
  }
});

// Function to seed the database with products
async function seedProductsToMongoDB(forceRefresh = false) {
  console.log('Attempting to seed products to MongoDB...');
  
  try {
    const client = await connectToMongo();
    if (!client) {
      console.log('No MongoDB connection, skipping product seeding');
      return false;
    }
    
    const db = client.db();
    const collection = db.collection('products');
    
    // Check if we already have products
    const count = await collection.countDocuments();
    console.log(`Found ${count} existing products in database`);
    
    // Define reliable Unsplash image URLs for products
    const unsplashImages = {
      // Updated with user-selected images (corrected URLs)
      coffeeMaker: "https://images.unsplash.com/photo-1501492673258-2bcfc17241fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      kitchenKnives: "https://plus.unsplash.com/premium_photo-1726729339060-c35947b01c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      standMixer: "https://plus.unsplash.com/premium_photo-1718186096304-e8a0be862bc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      faceSerum: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      makeupBrushes: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      hairStyling: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      wirelessEarbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      winterJacket: "https://images.unsplash.com/photo-1544923246-77307dd654cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      blender: "https://plus.unsplash.com/premium_photo-1663853294058-3f85f18a4bed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      smartSpeaker: "https://images.unsplash.com/photo-1543512214-318c7553f230?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fitnessTracker: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      toasterOven: "https://plus.unsplash.com/premium_photo-1719452894874-3da9fa3b882c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    };
    
    // Define required products in all requested categories
    const requiredProducts = [
      // Home & Kitchen category
      {
        name: "Coffee Maker",
        description: "Premium automatic coffee maker with timer and programmable settings.",
        price: 79.99,
        category: "Home & Kitchen",
        inStock: true,
        featured: true,
        rating: 4.6,
        reviews: 85,
        imageUnsplash: unsplashImages.coffeeMaker,
        onSale: false,
        tags: ["kitchen", "appliances"],
        sku: "HK-CM-001"
      },
      {
        name: "Kitchen Knife Set",
        description: "Professional-grade kitchen knife set with wooden block.",
        price: 69.99,
        category: "Home & Kitchen",
        inStock: true,
        featured: false,
        rating: 4.8,
        reviews: 92,
        imageUnsplash: unsplashImages.kitchenKnives,
        isDeal: true,
        tags: ["kitchen", "cooking", "deal"],
        sku: "HK-KS-002"
      },
      {
        name: "Stand Mixer",
        description: "Powerful stand mixer for baking and cooking.",
        price: 129.99,
        category: "Home & Kitchen",
        inStock: true,
        featured: false,
        rating: 4.7,
        reviews: 64,
        imageUnsplash: unsplashImages.standMixer,
        tags: ["kitchen", "baking"],
        sku: "HK-SM-003"
      },
      
      // Beauty category
      {
        name: "Face Serum",
        description: "Hydrating face serum with vitamin C and hyaluronic acid.",
        price: 24.99,
        category: "Beauty",
        inStock: true,
        featured: true,
        rating: 4.9,
        reviews: 120,
        imageUnsplash: unsplashImages.faceSerum,
        tags: ["skincare", "beauty"],
        sku: "BTY-FS-004"
      },
      {
        name: "Makeup Brush Set",
        description: "Professional makeup brush set with carrying case.",
        price: 34.99, 
        category: "Beauty",
        featured: false,
        inStock: true,
        rating: 4.6,
        reviews: 87,
        imageUnsplash: unsplashImages.makeupBrushes,
        tags: ["makeup", "beauty"],
        sku: "BTY-MB-005"
      },
      {
        name: "Hair Styling Kit",
        description: "Complete hair styling kit with dryer, straightener, and curling iron.",
        price: 89.99,
        category: "Beauty",
        inStock: true,
        featured: false,
        rating: 4.5,
        reviews: 76,
        imageUnsplash: unsplashImages.hairStyling,
        tags: ["hair", "beauty"],
        sku: "BTY-HK-006"
      },
      
      // Sale items - note these have real categories but are tagged as sale
      {
        name: "Wireless Earbuds",
        description: "Noise-cancelling wireless earbuds with premium sound quality.",
        price: 49.99,
        originalPrice: 79.99,
        category: "Electronics",
        inStock: true,
        featured: true,
        rating: 4.7,
        reviews: 215,
        imageUnsplash: unsplashImages.wirelessEarbuds,
        onSale: true,
        tags: ["electronics", "audio", "sale"],
        sku: "SALE-WE-007"
      },
      {
        name: "Winter Jacket",
        description: "Warm winter jacket with waterproof outer layer and insulated lining.",
        price: 79.99,
        originalPrice: 129.99,
        category: "Clothing",
        inStock: true,
        featured: false,
        rating: 4.5,
        reviews: 65,
        imageUnsplash: unsplashImages.winterJacket,
        onSale: true,
        tags: ["clothing", "winter", "sale"],
        sku: "SALE-WJ-008"
      },
      {
        name: "Blender",
        description: "High-power blender for smoothies and food prep.",
        price: 59.99,
        originalPrice: 89.99,
        category: "Home & Kitchen",
        inStock: true,
        featured: false,
        rating: 4.5,
        reviews: 94,
        imageUnsplash: unsplashImages.blender,
        onSale: true,
        tags: ["kitchen", "appliances", "sale"],
        sku: "SALE-BL-009"
      },
      
      // Deals items - note these have real categories but are tagged as deals
      {
        name: "Smart Speaker",
        description: "Voice-controlled smart speaker with built-in assistant.",
        price: 39.99,
        originalPrice: 59.99,
        category: "Electronics",
        inStock: true,
        featured: true,
        rating: 4.4,
        reviews: 178,
        imageUnsplash: unsplashImages.smartSpeaker,
        isDeal: true,
        tags: ["electronics", "smart home", "deal"],
        sku: "DEAL-SS-010"
      },
      {
        name: "Fitness Tracker",
        description: "Water-resistant fitness tracker with heart rate monitoring.",
        price: 49.99,
        originalPrice: 69.99,
        category: "Electronics",
        inStock: true,
        featured: false,
        rating: 4.3,
        reviews: 156,
        imageUnsplash: unsplashImages.fitnessTracker,
        isDeal: true,
        tags: ["electronics", "fitness", "deal"],
        sku: "DEAL-FT-011"
      },
      {
        name: "Toaster Oven",
        description: "Compact toaster oven with multiple cooking functions.",
        price: 44.99,
        originalPrice: 64.99,
        category: "Home & Kitchen",
        inStock: true,
        featured: false,
        rating: 4.2,
        reviews: 87,
        imageUnsplash: unsplashImages.toasterOven,
        isDeal: true,
        tags: ["kitchen", "appliances", "deal"],
        sku: "DEAL-TO-012"
      }
    ];
    
    // Get existing product names and SKUs
    const existingProductNames = await collection.distinct('name');
    const existingSkus = await collection.distinct('sku');
    console.log('Existing product names:', existingProductNames);
    console.log('Existing SKUs:', existingSkus);
    
    // If force refresh is enabled, update all products
    if (forceRefresh) {
      console.log('Force refresh enabled - updating all products');
      
      // First, let's check the Sale and Deals categories
      const saleCount = await collection.countDocuments({ onSale: true });
      const dealsCount = await collection.countDocuments({ isDeal: true });
      
      console.log(`Found ${saleCount} Sale products and ${dealsCount} Deals products`);
      
      // Process each product in our required list to ensure it exists with correct data
      for (const product of requiredProducts) {
        const imageUrl = product.imageUnsplash;
        
        // Prepare the product data with proper image URLs and ObjectId
        const processedProduct = {
          ...product,
          imageUrl: imageUrl,
          image: imageUrl,
          thumbnailUrl: imageUrl,
          // Add an images array for compatibility with existing code
          images: [imageUrl],
          // Remove the temporary imageUnsplash property
          imageUnsplash: undefined,
          // Add a slug for SEO-friendly URLs
          slug: product.name.toLowerCase().replace(/\s+/g, '-')
        };
        
        // Check if this product exists
        const existingProduct = await collection.findOne({ 
          $or: [
            { name: product.name },
            { sku: product.sku }
          ]
        });
        
        if (existingProduct) {
          // Update existing product
          console.log(`Updating existing product: ${product.name}`);
          
          // Keep the existing _id
          delete processedProduct._id;
          
          await collection.updateOne(
            { _id: existingProduct._id },
            { $set: processedProduct }
          );
        } else {
          // Insert new product
          console.log(`Adding new product: ${product.name}`);
          
          // Create a new MongoDB ObjectId
          processedProduct._id = new ObjectId();
          
          await collection.insertOne(processedProduct);
        }
      }
      
      console.log('Products updated successfully');
      await client.close();
      return true;
    }
    
    // Find products that don't exist yet by checking name and SKU
    const productsToAdd = requiredProducts.filter(
      product => !existingProductNames.includes(product.name) &&
                 !existingSkus.includes(product.sku)
    );
    
    if (productsToAdd.length > 0) {
      console.log(`Adding ${productsToAdd.length} required products to database...`);
      
      // Process the products to add proper ObjectIds and image URLs 
      const processedProducts = productsToAdd.map(product => {
        // Use the Unsplash image URL from our defined object
        const imageUrl = product.imageUnsplash;
        
        return {
          ...product,
          _id: new ObjectId(), // Generate a proper MongoDB ObjectId
          imageUrl: imageUrl,
          image: imageUrl,
          thumbnailUrl: imageUrl,
          // Add an images array for compatibility with existing code
          images: [imageUrl],
          // Remove the temporary imageUnsplash property
          imageUnsplash: undefined,
          // Add a slug for SEO-friendly URLs
          slug: product.name.toLowerCase().replace(/\s+/g, '-')
        };
      });
      
      // Insert the new products
      const result = await collection.insertMany(processedProducts);
      console.log(`Added ${result.insertedCount} new products to database with Unsplash images`);
      
      // Return success
      await client.close();
      return true;
    } else {
      console.log('All required products already exist in database');
      
      // Let's update existing products with Unsplash images if they don't have proper images
      const productsToUpdate = [];
      
      for (const requiredProduct of requiredProducts) {
        // Try to find the product by name
        const existingProduct = await collection.findOne({ 
          $or: [
            { name: requiredProduct.name },
            { sku: requiredProduct.sku }
          ]
        });
        
        if (existingProduct) {
          // Products that must be updated with new images regardless of current image
          const forceUpdateProducts = [
            "Coffee Maker", 
            "Kitchen Knife Set", 
            "Stand Mixer", 
            "Face Serum", 
            "Wireless Earbuds",
            "Blender",
            "Toaster Oven"
          ];
          
          // Determine if this product needs a forced update
          const needsForcedUpdate = forceUpdateProducts.includes(requiredProduct.name);
          
          // Check if the product already has an Unsplash image
          const hasUnsplashImage = existingProduct.imageUrl && 
                                existingProduct.imageUrl.includes('unsplash.com');
          
          // Update if it doesn't have an Unsplash image or if it needs a forced update
          if ((!hasUnsplashImage || needsForcedUpdate) && requiredProduct.imageUnsplash) {
            console.log(`Updating image for ${existingProduct.name} to use new Unsplash image`);
            
            const imageUrl = requiredProduct.imageUnsplash;
            
            // Update the product with proper image URLs
            await collection.updateOne(
              { _id: existingProduct._id },
              { 
                $set: {
                  imageUrl: imageUrl,
                  image: imageUrl,
                  thumbnailUrl: imageUrl,
                  images: [imageUrl]
                }
              }
            );
            
            productsToUpdate.push(existingProduct.name);
          }
        }
      }
      
      if (productsToUpdate.length > 0) {
        console.log(`Updated ${productsToUpdate.length} existing products with Unsplash images: ${productsToUpdate.join(', ')}`);
      }
      
      await client.close();
      return true;
    }
  } catch (error) {
    console.error('Error seeding products to MongoDB:', error);
    return false;
  }
}

// Call the seed function on startup
seedProductsToMongoDB().then(seeded => {
  if (seeded) {
    console.log('Product seeding completed successfully');
  } else {
    console.log('Product seeding skipped or failed');
  }
}).catch(err => {
  console.error('Product seeding error:', err);
});

// Get all products
app.get('/api/products', async (req, res) => {
  console.log('GET /api/products');
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      const products = await db.collection('products').find().toArray();
      await client.close();
      
      if (products.length > 0) {
        console.log(`Found ${products.length} products in database`);
        
        // Transform the products for consistency
        const transformedProducts = products.map(product => {
          // Determine the proper image URL
          let mainImage = null;
          
          if (product.images && product.images.length > 0) {
            mainImage = getImageUrl(product.images[0]);
          } else if (product.image) {
            mainImage = getImageUrl(product.image);
          } else if (product.imageUrl) {
            mainImage = getImageUrl(product.imageUrl);
          } else {
            mainImage = getPlaceholderImage(product.name);
          }
          
          // Ensure the price is a valid number
          const price = typeof product.price === 'number' ? product.price : 
                       typeof product.price === 'string' ? parseFloat(product.price) : 
                       99.99; // Default price if undefined or invalid
          
          return {
            ...product,
            _id: product._id.toString(), // Convert ObjectId to string for frontend
            // Use the same image for both main and thumbnail
            image: mainImage,
            imageUrl: mainImage,
            thumbnailUrl: mainImage,
            // Ensure price is a valid number
            price: price,
            // Ensure stock status is set
            inStock: product.inStock === undefined ? true : !!product.inStock
          };
        });
        
        return res.json(transformedProducts);
      }
      
      console.log('No products found in database');
    }
    
    // If we get here, either no MongoDB connection or empty database
    // Trigger the seeding function to populate the database
    console.log('Attempting to seed products into the database...');
    const seedResult = await seedProductsToMongoDB();
    
    if (seedResult) {
      // Try again with the database after seeding
      const client = await connectToMongo();
      if (client) {
        const db = client.db();
        const products = await db.collection('products').find().toArray();
        await client.close();
        
        if (products.length > 0) {
          console.log(`Found ${products.length} products after seeding`);
          return res.json(products.map(product => ({
            ...product,
            _id: product._id.toString()
          })));
        }
      }
    }
    
    // Last resort - return empty array if still no products
    console.log('No products available, returning empty array');
    res.json([]);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.json([]);
  }
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
          mainImage = getImageUrl(product.images[0]);
        } else if (product.image) {
          mainImage = getImageUrl(product.image);
        } else if (product.imageUrl) {
          mainImage = getImageUrl(product.imageUrl);
        } else {
          // Use a nicer looking placeholder from Unsplash instead of placeholder.com
          mainImage = getPlaceholderImage(product.name);
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        return {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both properties for compatibility
          image: mainImage,
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock === undefined ? true : !!product.inStock,
          // Ensure featured flag is set
          featured: product.featured === undefined ? false : !!product.featured,
          // Add a formatted slug for nicer URLs (if not already present)
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
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

// Get products on sale
app.get('/api/products/sale', async (req, res) => {
  console.log('GET /api/products/sale');
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      const products = await db.collection('products').find({ onSale: true }).toArray();
      console.log(`Found ${products.length} products on sale in database`);
      
      // Use the same transformation logic for consistency
      const transformedProducts = products.map(product => {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = getImageUrl(product.images[0]);
        } else if (product.image) {
          mainImage = getImageUrl(product.image);
        } else if (product.imageUrl) {
          mainImage = getImageUrl(product.imageUrl);
        } else {
          // Use a nicer looking placeholder from Unsplash instead of placeholder.com
          mainImage = getPlaceholderImage(product.name);
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        return {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both properties for compatibility
          image: mainImage,
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock === undefined ? true : !!product.inStock,
          // Ensure featured flag is set
          featured: product.featured === undefined ? false : !!product.featured,
          // Add a formatted slug for nicer URLs (if not already present)
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
        };
      });
      
      await client.close();
      
      if (transformedProducts.length > 0) {
        return res.json(transformedProducts);
      }
      // If no products on sale found, fall through to mock data
    }
  } catch (error) {
    console.error('Error fetching products on sale:', error.message);
  }
  
  // Fallback products on sale (with price explicitly as number and thumbnails)
  const mockSale = [
    { 
      _id: "3", 
      name: "Wireless Earbuds", 
      price: 49.99, 
      isFeatured: false, 
      featured: false,
      imageUrl: `/public/sample-images/product3.jpg`,
      thumbnailUrl: `/public/sample-images/product3.jpg`,
      image: `/public/sample-images/product3.jpg`,
      inStock: true,
      onSale: true,
      originalPrice: "69.99",
      sku: "ELEC-WE-003"
    },
    { 
      _id: "4", 
      name: "Winter Jacket", 
      price: 79.99, 
      isFeatured: false, 
      featured: false,
      imageUrl: `/public/sample-images/product4.jpg`,
      thumbnailUrl: `/public/sample-images/product4.jpg`,
      image: `/public/sample-images/product4.jpg`,
      inStock: true,
      onSale: true,
      originalPrice: "99.99",
      sku: "CLO-WJ-004"
    }
  ];
  console.log('Returning mock products on sale as fallback');
  res.json(mockSale);
});

// Get deal products
app.get('/api/products/deals', async (req, res) => {
  console.log('GET /api/products/deals');
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      const products = await db.collection('products').find({ isDeal: true }).toArray();
      console.log(`Found ${products.length} deal products in database`);
      
      // Use the same transformation logic for consistency
      const transformedProducts = products.map(product => {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = getImageUrl(product.images[0]);
        } else if (product.image) {
          mainImage = getImageUrl(product.image);
        } else if (product.imageUrl) {
          mainImage = getImageUrl(product.imageUrl);
        } else {
          // Use a nicer looking placeholder from Unsplash instead of placeholder.com
          mainImage = getPlaceholderImage(product.name);
        }
        
        // Ensure the price is a valid number
        const price = typeof product.price === 'number' ? product.price : 
                     typeof product.price === 'string' ? parseFloat(product.price) : 
                     99.99; // Default price if undefined or invalid
        
        return {
          ...product,
          _id: product._id.toString(),
          // Use the same image for both properties for compatibility
          image: mainImage,
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock === undefined ? true : !!product.inStock,
          // Ensure featured flag is set
          featured: product.featured === undefined ? false : !!product.featured,
          // Add a formatted slug for nicer URLs (if not already present)
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
        };
      });
      
      await client.close();
      
      if (transformedProducts.length > 0) {
        return res.json(transformedProducts);
      }
      // If no deal products found, fall through to mock data
    }
  } catch (error) {
    console.error('Error fetching deal products:', error.message);
  }
  
  // Fallback deal products (with price explicitly as number and thumbnails)
  const mockDeals = [
    { 
      _id: "5", 
      name: "Smart Speaker", 
      price: 39.99, 
      isFeatured: false, 
      featured: false,
      imageUrl: `/public/sample-images/product1.jpg`,
      thumbnailUrl: `/public/sample-images/product1.jpg`,
      image: `/public/sample-images/product1.jpg`,
      inStock: true,
      isDeal: true,
      sku: "ELEC-SS-005"
    },
    { 
      _id: "6", 
      name: "Kitchen Knife Set", 
      price: 69.99, 
      isFeatured: false, 
      featured: false,
      imageUrl: `/public/sample-images/product2.jpg`,
      thumbnailUrl: `/public/sample-images/product2.jpg`,
      image: `/public/sample-images/product2.jpg`,
      inStock: true,
      isDeal: true,
      sku: "HK-KS-006"
    }
  ];
  console.log('Returning mock deal products as fallback');
  res.json(mockDeals);
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  const category = req.params.category;
  
  // Format the category (convert from URL format to display format)
  // Example: "home-kitchen" becomes "Home & Kitchen"
  let formattedCategory = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Special case for "home-kitchen" -> "Home & Kitchen"
  if (formattedCategory === "Home Kitchen") {
    formattedCategory = "Home & Kitchen";
  }
  
  console.log(`GET /api/products/category/${category} (formatted: ${formattedCategory})`);
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      
      // Special handling for "sale" and "deals" categories
      if (category === "sale" || category === "deals") {
        console.log(`Special handling for ${category} category`);
        
        let query = {};
        if (category === "sale") {
          query = { onSale: true };
        } else if (category === "deals") {
          query = { isDeal: true };
        }
        
        // Find products matching the query
        const products = await db.collection('products').find(query).toArray();
        
        if (products.length > 0) {
          console.log(`Found ${products.length} products in ${category} category`);
          
          // Transform the products to ensure consistent object structure
          const transformedProducts = products.map(product => {
            // Determine the proper image URL
            let mainImage = null;
            
            if (product.images && product.images.length > 0) {
              mainImage = product.images[0];
            } else if (product.image) {
              mainImage = product.image;
            } else if (product.imageUrl) {
              mainImage = product.imageUrl;
            } else {
              mainImage = `/images/sample/placeholder.jpg`;
            }
            
            // Ensure the price is a valid number
            const price = typeof product.price === 'number' ? product.price : 
                          typeof product.price === 'string' ? parseFloat(product.price) : 
                          99.99; // Default price if undefined or invalid
            
            return {
              ...product,
              _id: product._id.toString(), // Convert ObjectId to string for frontend
              // Ensure image URLs are set
              image: mainImage,
              imageUrl: mainImage,
              thumbnailUrl: mainImage,
              // Ensure price is a valid number
              price: price,
              // Ensure stock status is set
              inStock: product.inStock === undefined ? true : !!product.inStock
            };
          });
          
          await client.close();
          return res.json(transformedProducts);
        } else {
          console.log(`No products found in ${category} category, attempting to trigger product refresh`);
          
          // Close the existing connection first
          await client.close();
          
          // Try to refresh the products
          await seedProductsToMongoDB(true);
          
          // Try again with a new connection
          const refreshClient = await connectToMongo();
          if (refreshClient) {
            const refreshDb = refreshClient.db();
            const refreshedProducts = await refreshDb.collection('products').find(query).toArray();
            await refreshClient.close();
            
            if (refreshedProducts.length > 0) {
              console.log(`Found ${refreshedProducts.length} products in ${category} category after refresh`);
              return res.json(refreshedProducts.map(product => ({
                ...product,
                _id: product._id.toString()
              })));
            }
          }
          
          // If still no products, return empty array
          console.log(`Still no products found in ${category} category after refresh`);
          return res.json([]);
        }
      }
      
      // Normal category handling (for non-sale, non-deals categories)
      // Try to find by category using various patterns for flexible matching
      const categoryPatterns = [
        formattedCategory,                          // Exact match
        new RegExp(`^${formattedCategory}$`, 'i'),  // Case-insensitive exact match
        new RegExp(formattedCategory, 'i'),         // Contains the category
        // For handling special cases
        category.toLowerCase()
      ];
      
      console.log(`Searching for products with category patterns: ${categoryPatterns.map(p => p.toString()).join(', ')}`);
      
      let products = [];
      
      // First attempt: exact category matches
      products = await db.collection('products').find({
        $or: [
          { category: { $in: categoryPatterns.filter(p => typeof p === 'string') } },
          { category: { $regex: categoryPatterns.filter(p => p instanceof RegExp)[0] } }
        ]
      }).toArray();
      
      // Second attempt: check for tags if category didn't match
      if (products.length === 0) {
        console.log(`No products found with direct category match, checking tags for: ${category}`);
        products = await db.collection('products').find({
          tags: { $regex: new RegExp(category.replace(/[-]/g, '|'), 'i') }
        }).toArray();
      }
      
      await client.close();
      
      if (products.length > 0) {
        console.log(`Found ${products.length} products in database for category: ${formattedCategory}`);
        
        // Transform the products to ensure consistent object structure
        const transformedProducts = products.map(product => {
          // Determine the proper image URL
          let mainImage = null;
          
          if (product.images && product.images.length > 0) {
            mainImage = product.images[0];
          } else if (product.image) {
            mainImage = product.image;
          } else if (product.imageUrl) {
            mainImage = product.imageUrl;
          } else {
            mainImage = `/images/sample/placeholder.jpg`;
          }
          
          // Ensure the price is a valid number
          const price = typeof product.price === 'number' ? product.price : 
                       typeof product.price === 'string' ? parseFloat(product.price) : 
                       99.99; // Default price if undefined or invalid
          
          return {
            ...product,
            _id: product._id.toString(), // Convert ObjectId to string for frontend
            // Use the same image for both main and thumbnail
            image: mainImage,
            imageUrl: mainImage,
            thumbnailUrl: mainImage,
            // Ensure price is a valid number
            price: price,
            // Ensure stock status is set
            inStock: product.inStock === undefined ? true : !!product.inStock
          };
        });
        
        res.json(transformedProducts);
        return;
      }
      
      console.log(`No products found in category: ${formattedCategory}`);
    }
    
    // If we get here, either no MongoDB connection or no products found
    console.log(`Returning empty array for category: ${formattedCategory}`);
    res.json([]);
  } catch (error) {
    console.error(`Error fetching products for category ${formattedCategory}:`, error);
    // Even on error, return an empty array instead of an error object
    res.json([]);
  }
});

// Get product by ID - this must come after other routes with specific paths
app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  console.log(`GET /api/products/${id}`);
  
  try {
    const client = await connectToMongo();
    
    if (client) {
      const db = client.db();
      let product;
      
      // Try various ways to find the product
      // 1. First check if ID is a valid MongoDB ObjectId
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(`Looking for product with MongoDB ObjectId: ${id}`);
        product = await db.collection('products').findOne({ _id: new ObjectId(id) });
      }
      
      // 2. If not found, try by string ID (if products use string IDs)
      if (!product) {
        console.log(`Looking for product with string ID: ${id}`);
        product = await db.collection('products').findOne({ _id: id });
        
        // Also try with a numeric conversion of the ID
        if (!product && !isNaN(parseInt(id))) {
          console.log(`Looking for product with numeric ID: ${parseInt(id)}`);
          product = await db.collection('products').findOne({ _id: parseInt(id) });
        }
      }
      
      // 3. If not found, try a more flexible ObjectId search - check if any _id ends with this id
      if (!product && id.length < 24) {
        console.log(`Looking for product with ObjectId ending with: ${id}`);
        const allProducts = await db.collection('products').find({}).toArray();
        product = allProducts.find(p => 
          p._id && p._id.toString && p._id.toString().endsWith(id)
        );
      }
      
      // 4. Try by product slug if not found by ID
      if (!product) {
        console.log(`Looking for product with slug: ${id}`);
        product = await db.collection('products').findOne({ slug: id });
      }
      
      // 5. Try by name (case-insensitive)
      if (!product) {
        console.log(`Looking for product with name: ${id}`);
        product = await db.collection('products').findOne({ 
          name: { $regex: new RegExp('^' + id.replace(/-/g, ' ') + '$', 'i') }
        });
      }
      
      await client.close();
      
      if (product) {
        // Determine the proper image URL or provide a fallback
        let mainImage = null;
        
        if (product.images && product.images.length > 0) {
          mainImage = getImageUrl(product.images[0]);
        } else if (product.image) {
          mainImage = getImageUrl(product.image);
        } else if (product.imageUrl) {
          mainImage = getImageUrl(product.imageUrl);
        } else {
          mainImage = getPlaceholderImage(product.name);
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
          image: mainImage,
          imageUrl: mainImage,
          thumbnailUrl: mainImage,
          // Ensure price is a valid number
          price: price,
          // Ensure stock status is set
          inStock: product.inStock === undefined ? true : !!product.inStock,
          // Ensure featured flag is set
          featured: product.featured === undefined ? false : !!product.featured,
          // Add a formatted slug for nicer URLs (if not already present)
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
        };
        
        return res.json(transformedProduct);
      }
    }
    
    // If we get here, no product was found - check the mock products
    console.log(`Product ${id} not found in database, checking mockProducts`);
    
    // Create an array with all our mock products for easier searching
    const allMockProducts = [...mockCategory, ...mockSale, ...mockDeals];
    
    // Check our mock products by ID and return if found
    const mockProduct = allMockProducts.find(p => 
      p._id === id || 
      p.id === id || 
      p.slug === id || 
      p.name?.toLowerCase()?.replace(/\s+/g, '-') === id.toLowerCase() ||
      p.name?.toLowerCase() === id.toLowerCase().replace(/-/g, ' ')
    );
    
    if (mockProduct) {
      console.log(`Found matching mock product: ${mockProduct.name}`);
      
      // Make sure we serve complete images
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let imageUrl = mockProduct.imageUrl;
      
      // If the image path is relative, make it absolute
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      
      // Return with updated image URLs
      return res.json({
        ...mockProduct,
        imageUrl: imageUrl,
        thumbnailUrl: imageUrl,
        image: imageUrl
      });
    }
    
    // Not found in DB or mocks
    console.log(`Product ${id} not found in database or mock data`);
    res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
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

// Create a Stripe payment intent for an order
async function createPaymentIntent(order) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return null;
    }
    
    const amount = Math.round(order.total * 100); // Convert to cents
    
    console.log(`Creating payment intent for order ${order.id} with amount ${amount} cents`);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        orderId: order.id || order.orderId || '',
        customerEmail: order.customer?.email || ''
      },
      description: `Order ${order.id || order.orderId || 'Unknown'}`
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`);
    
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

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
  
  // Create a payment intent in Stripe
  let paymentData = null;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      paymentData = await createPaymentIntent(order);
      if (paymentData) {
        order.payment.stripePaymentIntentId = paymentData.paymentIntentId;
        order.payment.stripeClientSecret = paymentData.clientSecret;
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
  }
  
  console.log('Successfully created order:', { 
    id: order.id, 
    status: order.status,
    itemCount: items.length,
    total: total,
    stripePaymentIntent: order.payment.stripePaymentIntentId || 'Not created'
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

// Checkout endpoint - updated to be more flexible with request format
app.post('/api/checkout', async (req, res) => {
  console.log('=== CHECKOUT ENDPOINT CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  
  // Extract order data
  const orderData = req.body;
  
  // Extract items from various possible locations
  let items = [];
  if (Array.isArray(orderData.items)) {
    items = orderData.items;
  } else if (orderData.cart?.items && Array.isArray(orderData.cart.items)) {
    items = orderData.cart.items;
  } else if (Array.isArray(orderData.cart)) {
    items = orderData.cart;
  } else if (Array.isArray(orderData.products)) {
    items = orderData.products;
  }
  
  console.log(`Found ${items.length} items for order`);
  
  // Default values for order
  const total = orderData.total || items.reduce((sum, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  // Generate order ID
  const timestamp = Date.now();
  const orderId = `ORD-${timestamp}`;
  
  // Create order object
  const order = {
    id: orderId,
    items,
    total,
    customer: orderData.customer || orderData.customerInfo || {},
    shipping: orderData.shipping || orderData.shippingInfo || {},
    billing: orderData.billing || orderData.billingInfo || {},
    status: 'processing',
    createdAt: new Date().toISOString()
  };
  
  // Calculate subtotal, tax, and shipping
  let subtotal = 0;
  if (items && items.length > 0) {
    subtotal = items.reduce((sum, item) => {
      const price = item.price || item.unitPrice || item.product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  }
  
  const shippingCost = orderData.shipping?.cost || 5.99;
  const tax = orderData.tax || Number((subtotal * 0.08).toFixed(2));
  
  order.subtotal = subtotal;
  order.tax = tax;
  order.shipping.cost = shippingCost;
  order.total = subtotal + shippingCost + tax;
  
  // Create a payment intent in Stripe
  let paymentData = null;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      paymentData = await createPaymentIntent(order);
      if (paymentData) {
        // Add Stripe payment details to order
        order.payment = order.payment || {};
        order.payment.stripePaymentIntentId = paymentData.paymentIntentId;
        order.payment.stripeClientSecret = paymentData.clientSecret;
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
  }
  
  console.log('Successfully created order:', { 
    id: order.id, 
    total: order.total,
    stripePaymentIntent: order.payment?.stripePaymentIntentId || 'Not created'
  });
  
  // Clear the cart after checkout
  cartData.items = [];
  
  // Return order with payment intent details
  res.json(order);
  
  // Extract customer email for confirmation
  const customerEmail = order.customer?.email || 
                       order.shipping?.email || 
                       orderData.email;
  
  // Send confirmation email async after response
  if (customerEmail) {
    try {
      console.log('Sending confirmation email to:', customerEmail);
      sendOrderConfirmationEmail(order, customerEmail)
        .then(info => console.log('Email sent:', !!info))
        .catch(err => console.error('Email error:', err));
    } catch (error) {
      console.error('Error in email process:', error);
    }
  }
});

// Add a Stripe test endpoint to trigger a test event
app.get('/api/stripe/test', async (req, res) => {
  console.log('Stripe test endpoint called');
  console.log('Environment values:', {
    NODE_ENV: process.env.NODE_ENV,
    ALLOW_TEST_ENDPOINTS: process.env.ALLOW_TEST_ENDPOINTS,
    ALLOW_TEST_ENDPOINTS_TYPE: typeof process.env.ALLOW_TEST_ENDPOINTS,
    STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY
  });
  
  // For this portfolio project, we'll always allow the test endpoint
  // Bypass the production check completely
  if (false) { // Changed condition to always allow access
    return res.status(403).json({ error: 'Test endpoint not available in production' });
  }
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Missing Stripe API key',
        stripeConfigured: false,
        message: 'Please set the STRIPE_SECRET_KEY environment variable in Railway',
        debug: {
          NODE_ENV: process.env.NODE_ENV,
          ALLOW_TEST_ENDPOINTS: process.env.ALLOW_TEST_ENDPOINTS
        }
      });
    }
    
    console.log('Creating a test payment intent');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1999,
      currency: 'usd',
      metadata: {
        orderId: 'test-order-' + Date.now()
      }
    });
    
    console.log('Test payment intent created:', paymentIntent.id);
    
    res.json({ 
      success: true,
      message: 'Test payment intent created successfully',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: '$19.99',
      stripeConfigured: true,
      stripeApiKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      checkStripeAccount: 'Check your Stripe dashboard to see this payment intent'
    });
  } catch (err) {
    console.error('Error creating test payment intent:', err);
    res.status(500).json({ 
      error: err.message,
      stripeConfigured: false,
      possibleIssue: 'Your Stripe API key might be invalid or expired'
    });
  }
});

// Generic catch-all endpoint for debugging
app.all('/api/*', (req, res, next) => {
  // Skip known endpoints
  const knownPaths = [
    '/api/stripe/test',
    '/api/webhook/stripe'
  ];
  
  if (knownPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
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

// Stripe webhook endpoint
app.post('/api/webhook/stripe', async (req, res) => {
  console.log('Received Stripe webhook event');
  
  let event;
  
  try {
    // Verify the event came from Stripe
    const signature = req.headers['stripe-signature'];
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return res.status(500).send('Webhook secret not configured');
    }
    
    try {
      // Use the Stripe SDK to verify the signature
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle specific events
    console.log('Webhook event type:', event.type);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update order status, send confirmation email, etc.
        // You can access metadata you passed with the payment:
        const orderId = paymentIntent.metadata.orderId;
        if (orderId) {
          console.log('Order ID from metadata:', orderId);
          
          // In a real implementation, you would update the order in the database
          // and possibly trigger other actions like inventory updates
        }
        break;
        
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        
        // Similar to payment_intent.succeeded, process the completed checkout
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Handle failed payment, maybe send notification to customer
        break;
        
      // You can add more event types as needed
      
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true, type: event.type });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
});

// Add a debug endpoint to check email configuration
// Only accessible in non-production environment or with debug flag
app.get('/api/debug/email-config', (req, res) => {
  // Limit access to this endpoint for security
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ENDPOINTS) {
    return res.status(403).json({ error: 'Debug endpoints not available in production' });
  }
  
  // Collect all email-related environment variables (masking sensitive info)
  const config = {
    EMAIL_FROM: process.env.EMAIL_FROM || 'Not set',
    SMTP_FROM: process.env.SMTP_FROM || 'Not set',
    EMAIL_HOST: process.env.EMAIL_HOST || 'Not set',
    SMTP_HOST: process.env.SMTP_HOST || 'Not set',
    EMAIL_PORT: process.env.EMAIL_PORT || 'Not set',
    SMTP_PORT: process.env.SMTP_PORT || 'Not set',
    EMAIL_USER: process.env.EMAIL_USER ? maskEmail(process.env.EMAIL_USER) : 'Not set',
    SMTP_USER: process.env.SMTP_USER ? maskEmail(process.env.SMTP_USER) : 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? '********' : 'Not set',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '********' : 'Not set',
    EMAIL_SECURE: process.env.EMAIL_SECURE || 'Not set',
    SMTP_SECURE: process.env.SMTP_SECURE || 'Not set',
    transporterConfigured: !!emailTransporter,
    transporterFrom: emailTransporter?.options?.from || 'Not available'
  };
  
  // Return the config information
  res.json({
    message: 'Email configuration',
    config,
    environment: process.env.NODE_ENV || 'development',
    railwayProject: process.env.RAILWAY_PROJECT_NAME || 'Unknown',
    railwayService: process.env.RAILWAY_SERVICE_NAME || 'Unknown'
  });
});

// Helper function to mask email addresses for privacy
function maskEmail(email) {
  if (!email || !email.includes('@')) return '****@****.com';
  
  const parts = email.split('@');
  let username = parts[0];
  const domain = parts[1];
  
  if (username.length <= 3) {
    username = '***';
  } else {
    username = username.substring(0, 2) + '***' + username.substring(username.length - 1);
  }
  
  return `${username}@${domain}`;
}

// Add some sample images to the public directory
async function seedSampleImages() {
  console.log('Checking for sample images to seed...');
  
  // Download a sample image from unsplash to the public directory
  const downloadImage = async (url, filename) => {
    try {
      const fullPath = path.join(imagesDir, filename);
      
      // Skip if the file already exists
      if (fs.existsSync(fullPath)) {
        console.log(`Sample image ${filename} already exists, skipping`);
        return true;
      }
      
      // Create a write stream for the image
      const fileStream = fs.createWriteStream(fullPath);
      
      // Use fetch to download the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Pipe the response to the file
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(fullPath, buffer);
      
      console.log(`Downloaded sample image ${filename}`);
      return true;
    } catch (error) {
      console.error(`Error downloading image ${filename}:`, error);
      return false;
    }
  };
  
  // Sample images to download
  const samplesToDownload = [
    { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", filename: "product1.jpg" },
    { url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80", filename: "product2.jpg" },
    { url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&q=80", filename: "product3.jpg" },
    { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", filename: "product4.jpg" }
  ];
  
  // Download all sample images
  for (const sample of samplesToDownload) {
    await downloadImage(sample.url, sample.filename);
  }
  
  console.log('Sample image seeding complete');
}

// Call the seed function on startup
seedSampleImages().catch(err => {
  console.error('Error seeding sample images:', err);
});

// Add an endpoint to get a list of sample images
app.get('/api/sample-images', (req, res) => {
  try {
    // List all files in the images directory
    const files = fs.readdirSync(imagesDir);
    
    // Filter for image files only
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    // Generate URLs for all images
    const imageUrls = imageFiles.map(file => {
      return {
        filename: file,
        url: getImageUrl(file)
      };
    });
    
    // Add placeholder URLs from unsplash
    const allImages = [
      ...imageUrls,
      ...placeholderImages.map((url, i) => ({
        filename: `placeholder${i+1}.jpg`,
        url
      }))
    ];
    
    res.json({
      message: 'Sample images available',
      images: allImages
    });
  } catch (error) {
    console.error('Error listing sample images:', error);
    res.status(500).json({ error: 'Failed to list sample images' });
  }
});

// Add an admin endpoint to force reseed products
app.get('/api/admin/reseed-products', async (req, res) => {
  console.log('Admin request to reseed products');
  
  try {
    const success = await seedProductsToMongoDB();
    
    if (success) {
      console.log('Product reseeding completed successfully');
      res.json({ success: true, message: 'Products reseeded successfully' });
    } else {
      console.log('Product reseeding failed');
      res.status(500).json({ success: false, message: 'Failed to reseed products' });
    }
  } catch (error) {
    console.error('Error in reseed products endpoint:', error);
    res.status(500).json({ success: false, message: 'Error reseeding products', error: error.message });
  }
});

// Add a separate endpoint to refresh product data
app.get('/api/admin/refresh-products', async (req, res) => {
  console.log('Refreshing product data...');
  
  try {
    // Call the seed function with force refresh option
    const result = await seedProductsToMongoDB(true);
    
    if (result) {
      res.json({ success: true, message: 'Product data refreshed successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to refresh product data' });
    }
  } catch (error) {
    console.error('Error refreshing product data:', error);
    res.status(500).json({ success: false, message: 'Error refreshing product data', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize the sample images directory
  await seedSampleImages();
  
  // Initialize the database with required products
  await seedProductsToMongoDB();
}); 